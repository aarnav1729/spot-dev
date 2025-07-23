CREATE TABLE History (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    HTicket_Number VARCHAR(50) NOT NULL,
    UserID NVARCHAR(50) NOT NULL,
    Comment TEXT NULL,
    Action_Type VARCHAR(100) NOT NULL,
    Before_State VARCHAR(50) NOT NULL,
    After_State VARCHAR(50) NOT NULL,
    Timestamp DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (HTicket_Number) REFERENCES Tickets(Ticket_Number),
    FOREIGN KEY (UserID) REFERENCES EMP(EmpID)
);