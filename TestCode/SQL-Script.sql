CREATE TABLE USER(
    USER_ID nvarchar(max) PRIMARY KEY NOT NULL,
    USER_PW nvarchar(max) NOT NULL,
    USER_NM nvarchar(max) NOT NULL,
    USER_EMAIL nvarchar(max) NULL,
    USER_ADDRESS nvarchar(max) NULL
)