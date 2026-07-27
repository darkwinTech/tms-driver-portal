/* =============================================================================
   TMS Driver Portal - Database Schema
   =============================================================================
   Run this manually in SSMS against your existing SQL Server database.
   It is idempotent (safe to re-run) and confined entirely to a dedicated
   `tms` schema so it cannot collide with anything else already in the
   database.

   The backend application does NOT connect to this schema yet - it still
   runs on an in-memory mock store (see backend/src/data/). This script is a
   forward-looking schema design only; wiring the backend up to SQL Server is
   a separate, later piece of work.

   Recommended workflow: run this once against a scratch/test database first
   (Query > Parse in SSMS to check syntax, then execute and drop it) before
   running it against the shared database you actually use.

   Sections:
     1. Schema
     2. Lookup tables (RequestType, RequestStatus) + seed data
     3. Core tables (User, Request, Driver, DriverDirectory, RequestHistory,
        Attachment, Notification)
     4. Indexes
     5. Least-privilege application login
   ============================================================================= */

-- Uncomment and point this at your target database before running:
-- USE YourExistingDatabaseName;
-- GO

SET NOCOUNT ON;
GO

/* -----------------------------------------------------------------------------
   1. Schema
   ----------------------------------------------------------------------------- */

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'tms')
BEGIN
    EXEC('CREATE SCHEMA tms');
END
GO

/* -----------------------------------------------------------------------------
   2. Lookup tables
   ----------------------------------------------------------------------------- */

IF OBJECT_ID('tms.RequestType', 'U') IS NULL
BEGIN
    CREATE TABLE tms.RequestType (
        Id   INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(30) NOT NULL UNIQUE
    );
END
GO

IF OBJECT_ID('tms.RequestStatus', 'U') IS NULL
BEGIN
    CREATE TABLE tms.RequestStatus (
        Id   INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(30) NOT NULL UNIQUE
    );
END
GO

-- Seed values mirror backend/src/data/seed.js (requestTypes / requestStatuses).
-- These INSERTs only add rows that are missing, so re-running is harmless.
INSERT INTO tms.RequestType (Name)
SELECT v.Name
FROM (VALUES ('Create Driver'), ('Modify Driver'), ('Disable Driver')) AS v(Name)
WHERE NOT EXISTS (SELECT 1 FROM tms.RequestType rt WHERE rt.Name = v.Name);
GO

INSERT INTO tms.RequestStatus (Name)
SELECT v.Name
FROM (VALUES
    ('Submitted'),
    ('Under Review'),
    ('Returned to Requester'),
    ('Processing'),
    ('AD Team Review'),
    ('RPA Triggered'),
    ('Completed'),
    ('Rejected')
) AS v(Name)
WHERE NOT EXISTS (SELECT 1 FROM tms.RequestStatus rs WHERE rs.Name = v.Name);
GO

/* -----------------------------------------------------------------------------
   3. Core tables
   ----------------------------------------------------------------------------- */

-- tms.User
-- Local bcrypt+JWT auth is an interim measure ahead of ADFS/SSO integration.
-- AuthProvider/ExternalId let a future ADFS-backed row exist with no local
-- password, so that swap won't require a schema change or a dummy hash.
IF OBJECT_ID('tms.User', 'U') IS NULL
BEGIN
    CREATE TABLE tms.User (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        EmployeeId   NVARCHAR(20)  NOT NULL,
        FullName     NVARCHAR(150) NOT NULL,
        Email        NVARCHAR(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
        PasswordHash NVARCHAR(255) NULL,
        Department   NVARCHAR(100) NOT NULL,
        Role         NVARCHAR(20)  NOT NULL,
        ManagerId    INT NULL,
        IsActive     BIT NOT NULL DEFAULT 1,
        AuthProvider NVARCHAR(20) NOT NULL DEFAULT 'Local',
        ExternalId   NVARCHAR(150) NULL,
        CreatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT UQ_User_Email UNIQUE (Email),
        CONSTRAINT FK_User_Manager FOREIGN KEY (ManagerId) REFERENCES tms.User(Id),
        CONSTRAINT CK_User_Role CHECK (Role IN ('Requester', 'Processor', 'Operations', 'AD Team', 'Admin')),
        CONSTRAINT CK_User_AuthProvider CHECK (AuthProvider IN ('Local', 'ADFS')),
        CONSTRAINT CK_User_PasswordHash_RequiredForLocal CHECK (
            (AuthProvider = 'Local' AND PasswordHash IS NOT NULL) OR AuthProvider <> 'Local'
        )
    );
END
GO

-- tms.Request - the core "access request" entity
IF OBJECT_ID('tms.Request', 'U') IS NULL
BEGIN
    CREATE TABLE tms.Request (
        Id                        INT IDENTITY(1,1) PRIMARY KEY,
        RequestNumber             NVARCHAR(20)  NOT NULL UNIQUE,
        RequesterId               INT NOT NULL,
        RequestTypeId             INT NOT NULL,
        StatusId                  INT NOT NULL,
        Description               NVARCHAR(MAX) NOT NULL,
        BusinessJustification     NVARCHAR(MAX) NOT NULL,
        EntryMethod               NVARCHAR(20)  NOT NULL DEFAULT 'Manual',
        CurrentProcessorId        INT NULL,
        DriverProfilesCompletedAt DATETIME2 NULL,
        EffectiveDate             DATE NULL,
        SubmittedDate             DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CompletedDate             DATETIME2 NULL,
        CreatedAt                 DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt                 DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT FK_Request_Requester FOREIGN KEY (RequesterId) REFERENCES tms.User(Id),
        CONSTRAINT FK_Request_CurrentProcessor FOREIGN KEY (CurrentProcessorId) REFERENCES tms.User(Id),
        CONSTRAINT FK_Request_Type FOREIGN KEY (RequestTypeId) REFERENCES tms.RequestType(Id),
        CONSTRAINT FK_Request_Status FOREIGN KEY (StatusId) REFERENCES tms.RequestStatus(Id),
        CONSTRAINT CK_Request_EntryMethod CHECK (EntryMethod IN ('Manual', 'Excel Upload'))
    );
    -- Deliberately NO cascading delete from User to Request: users are
    -- deactivated (IsActive = 0), never hard-deleted, so a request's
    -- requester/processor history stays intact.
END
GO

-- tms.Driver - one row per driver within a request
IF OBJECT_ID('tms.Driver', 'U') IS NULL
BEGIN
    CREATE TABLE tms.Driver (
        Id             INT IDENTITY(1,1) PRIMARY KEY,
        RequestId      INT NOT NULL,
        Username       NVARCHAR(120) NULL,
        FirstName      NVARCHAR(50)  NOT NULL,
        LastName       NVARCHAR(50)  NOT NULL,
        Email          NVARCHAR(100) NOT NULL,
        Phone          NVARCHAR(10)  NOT NULL,
        Role           NVARCHAR(30)  NOT NULL DEFAULT 'Privileged User',
        CustomerGroup  NVARCHAR(50)  NULL,
        DriverClass    NVARCHAR(50)  NULL,
        OperatingHours NVARCHAR(100) NULL,
        LicenseNumber  NVARCHAR(20)  NULL,
        LicenseExpiry  DATE NULL,
        IDExpiry       DATE NULL,
        HasInsurance   NVARCHAR(3)   NULL,
        City           NVARCHAR(50)  NULL,
        PoNumber       NVARCHAR(30)  NULL,
        PoExpiry       DATE NULL,
        ChangeSummary  NVARCHAR(MAX) NULL,
        DriverStatus   NVARCHAR(20)  NULL,

        CONSTRAINT FK_Driver_Request FOREIGN KEY (RequestId) REFERENCES tms.Request(Id) ON DELETE CASCADE,
        CONSTRAINT CK_Driver_Phone CHECK (Phone LIKE '05[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
        CONSTRAINT CK_Driver_LicenseNumber CHECK (
            LicenseNumber IS NULL OR (LicenseNumber NOT LIKE '%[^0-9]%' AND LEN(LicenseNumber) BETWEEN 5 AND 20)
        ),
        CONSTRAINT CK_Driver_PoNumber CHECK (
            PoNumber IS NULL OR (PoNumber NOT LIKE '%[^0-9]%' AND LEN(PoNumber) BETWEEN 3 AND 30)
        ),
        CONSTRAINT CK_Driver_HasInsurance CHECK (HasInsurance IS NULL OR HasInsurance IN ('Yes', 'No'))
    );
    -- CASCADE from Request: a driver row has no meaning without its request.
    -- City is kept free-text rather than FK'd to a KSA-cities lookup table -
    -- nothing in the app reads such a lookup today, so adding one now would
    -- be speculative; revisit if/when a city picker needs server-side data.
END
GO

-- tms.DriverDirectory - authoritative "current driver roster" (AD/DCT)
IF OBJECT_ID('tms.DriverDirectory', 'U') IS NULL
BEGIN
    CREATE TABLE tms.DriverDirectory (
        Id             INT IDENTITY(1,1) PRIMARY KEY,
        Username       NVARCHAR(120) NOT NULL UNIQUE,
        FirstName      NVARCHAR(50)  NOT NULL,
        LastName       NVARCHAR(50)  NOT NULL,
        Email          NVARCHAR(100) NOT NULL,
        Phone          NVARCHAR(10)  NOT NULL,
        Role           NVARCHAR(30)  NOT NULL DEFAULT 'Privileged User',
        CustomerGroup  NVARCHAR(50)  NULL,
        DriverClass    NVARCHAR(50)  NULL,
        OperatingHours NVARCHAR(100) NULL,
        PoNumber       NVARCHAR(30)  NULL,
        PoExpiry       DATE NULL,
        Status         NVARCHAR(20)  NOT NULL DEFAULT 'Active',

        CONSTRAINT CK_DriverDirectory_Status CHECK (Status IN ('Active', 'Inactive'))
    );
END
GO

-- tms.RequestHistory - audit trail of every status transition
IF OBJECT_ID('tms.RequestHistory', 'U') IS NULL
BEGIN
    CREATE TABLE tms.RequestHistory (
        Id          INT IDENTITY(1,1) PRIMARY KEY,
        RequestId   INT NOT NULL,
        OldStatusId INT NULL,
        NewStatusId INT NOT NULL,
        ChangedBy   INT NOT NULL,
        Remarks     NVARCHAR(MAX) NULL,
        CreatedAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT FK_RequestHistory_Request FOREIGN KEY (RequestId) REFERENCES tms.Request(Id) ON DELETE CASCADE,
        CONSTRAINT FK_RequestHistory_OldStatus FOREIGN KEY (OldStatusId) REFERENCES tms.RequestStatus(Id),
        CONSTRAINT FK_RequestHistory_NewStatus FOREIGN KEY (NewStatusId) REFERENCES tms.RequestStatus(Id),
        CONSTRAINT FK_RequestHistory_ChangedBy FOREIGN KEY (ChangedBy) REFERENCES tms.User(Id)
    );
END
GO

-- tms.Attachment - files uploaded against a request (license/ID/photo/etc.)
IF OBJECT_ID('tms.Attachment', 'U') IS NULL
BEGIN
    CREATE TABLE tms.Attachment (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        RequestId    INT NOT NULL,
        FileName     NVARCHAR(255) NOT NULL,
        FilePath     NVARCHAR(500) NOT NULL,
        UploadedBy   INT NOT NULL,
        UploadedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        DriverIndex  INT NULL,
        DocType      NVARCHAR(30) NULL,

        CONSTRAINT FK_Attachment_Request FOREIGN KEY (RequestId) REFERENCES tms.Request(Id) ON DELETE CASCADE,
        CONSTRAINT FK_Attachment_UploadedBy FOREIGN KEY (UploadedBy) REFERENCES tms.User(Id)
    );
    -- DriverIndex is an ordinal position within the request's driver list,
    -- not a foreign key to Driver.Id - matches how the backend uses it today
    -- (backend/src/controllers/requestController.js).
END
GO

-- tms.Notification - in-app notifications sent to requesters
IF OBJECT_ID('tms.Notification', 'U') IS NULL
BEGIN
    CREATE TABLE tms.Notification (
        Id        INT IDENTITY(1,1) PRIMARY KEY,
        UserId    INT NOT NULL,
        RequestId INT NOT NULL,
        Title     NVARCHAR(200) NOT NULL,
        Message   NVARCHAR(MAX) NOT NULL,
        IsRead    BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT FK_Notification_User FOREIGN KEY (UserId) REFERENCES tms.User(Id),
        CONSTRAINT FK_Notification_Request FOREIGN KEY (RequestId) REFERENCES tms.Request(Id) ON DELETE CASCADE
    );
END
GO

/* -----------------------------------------------------------------------------
   4. Indexes
   ----------------------------------------------------------------------------- */

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Request_RequesterId' AND object_id = OBJECT_ID('tms.Request'))
    CREATE NONCLUSTERED INDEX IX_Request_RequesterId ON tms.Request(RequesterId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Request_StatusId' AND object_id = OBJECT_ID('tms.Request'))
    CREATE NONCLUSTERED INDEX IX_Request_StatusId ON tms.Request(StatusId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Request_RequestTypeId' AND object_id = OBJECT_ID('tms.Request'))
    CREATE NONCLUSTERED INDEX IX_Request_RequestTypeId ON tms.Request(RequestTypeId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Request_CurrentProcessorId' AND object_id = OBJECT_ID('tms.Request'))
    CREATE NONCLUSTERED INDEX IX_Request_CurrentProcessorId ON tms.Request(CurrentProcessorId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Driver_RequestId' AND object_id = OBJECT_ID('tms.Driver'))
    CREATE NONCLUSTERED INDEX IX_Driver_RequestId ON tms.Driver(RequestId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RequestHistory_RequestId' AND object_id = OBJECT_ID('tms.RequestHistory'))
    CREATE NONCLUSTERED INDEX IX_RequestHistory_RequestId ON tms.RequestHistory(RequestId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Attachment_RequestId' AND object_id = OBJECT_ID('tms.Attachment'))
    CREATE NONCLUSTERED INDEX IX_Attachment_RequestId ON tms.Attachment(RequestId);
GO
-- Composite, not two separate single-column indexes: the app's dominant
-- notification query is "unread notifications for this user".
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notification_UserId_IsRead' AND object_id = OBJECT_ID('tms.Notification'))
    CREATE NONCLUSTERED INDEX IX_Notification_UserId_IsRead ON tms.Notification(UserId, IsRead);
GO

/* -----------------------------------------------------------------------------
   5. Least-privilege application login
   ----------------------------------------------------------------------------- */
-- Once the backend is wired up to SQL Server, it should connect using this
-- login rather than a sysadmin/db_owner account - it can only read/write
-- inside the `tms` schema, nothing else in the shared database. DDL changes
-- (new tables, altered columns) should always be run manually via SSMS under
-- an administrator's own login, never through the app's runtime credential.
--
-- CHANGE THE PASSWORD below before running this anywhere but a scratch/test
-- database, and store the real one in a secrets manager, not source control.

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'tms_app')
BEGIN
    CREATE LOGIN tms_app WITH PASSWORD = 'ChangeThisPassword!123';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'tms_app')
BEGIN
    CREATE USER tms_app FOR LOGIN tms_app;
END
GO

GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::tms TO tms_app;
GO

/* -----------------------------------------------------------------------------
   Sanity checks (optional - run manually after executing the script above)
   -----------------------------------------------------------------------------
   SELECT COUNT(*) AS RequestTypeCount FROM tms.RequestType;   -- expect 3
   SELECT COUNT(*) AS RequestStatusCount FROM tms.RequestStatus; -- expect 8
   SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('tms') ORDER BY name;
   ----------------------------------------------------------------------------- */
