CREATE TABLE Assignee (
	Department NVARCHAR(100) NOT NULL,
	EmpLocation NVARCHAR(100) NOT NULL,
	Ticket_Type NVARCHAR(100) NOT NULL,
	Subtask NVARCHAR(100) NOT NULL,
	Task_Label NVARCHAR(255),
	Assignee_EmpID NVARCHAR(50),
	PRIMARY KEY (Department, EmpLocation, Ticket_Type, Subtask),
	FOREIGN KEY (Assignee_EmpID) REFERENCES EMP(EmpID)
	);