CREATE TABLE BOARD(
    HISTORY_IDX nvarchar(max) PRIMARY KEY NOT NULL,
    TITLE nvarchar(max) NOT NULL,
    WRITER nvarchar(max) NOT NULL,
    LIKE_CNT nvarchar(max) NULL,
    VIEWS_CNT nvarchar(max) NULL,
    CONTENT nvarchar(max) NOT NULL,
    COMENT nvarchar(max) NULL,
    WRITE_DT datetime(7) NOT NULL,
    REMARK nvarchar(max) NULL
)