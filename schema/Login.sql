CREATE TABLE Login (
    Serial_Number INT IDENTITY(1,1) PRIMARY KEY,
    Username VARCHAR(100) NOT NULL UNIQUE,
    LPassword VARCHAR(255) NOT NULL,
	LEmpID NVARCHAR(50) NOT NULL,
    OTP TEXT NULL,
    OTP-Expiry DATETIME NULL,
    FOREIGN KEY (LEmpID) REFERENCES EMP(EmpID)
);