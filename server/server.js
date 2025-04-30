const express = require("express");
const cors = require("cors");
const sql = require("mssql");
const dotenv = require("dotenv");
const { Client } = require("@microsoft/microsoft-graph-client");
const { ClientSecretCredential } = require("@azure/identity");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const https = require("https");
const fs = require("fs");
require("isomorphic-fetch");

dotenv.config();

const app = express();
const path = require("path");

// Use CORS to allow requests from the frontend
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://14.194.111.58:3000",
      "http://spot.premierenergies.com",
      "http://spot.premierenergies.com:3000",
      "http://spot.premierenergies.com/login",
      "https://14.194.111.58:3000",
      "https://spot.premierenergies.com",
      "https://spot.premierenergies.com:3000",
      "https://spot.premierenergies.com/login",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // <-- add OPTIONS
    credentials: true,
  })
);

// Also allow the server to respond to preflight automatically:
app.options("*", cors());

app.use(express.json()); // Middleware to parse JSON
app.use(express.static(path.join(__dirname, "..", "client", "build")));

// Database configuration
const dbConfig = {
  user: "SPOT_USER",
  password: "Premier#3801",
  server: "10.0.40.10",
  port: 1433,
  database: "SPOT",
  options: {
    trustServerCertificate: true,
    encrypt: false,
    connectionTimeout: 60000,
  },
};

// Initialize connection pool
let pool;

async function initializeDatabase() {
  try {
    pool = await sql.connect(dbConfig);
    console.log("Connected to the database");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1); // Exit process if the database connection fails
  }
}

// Middleware to use the existing connection pool
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src *; script-src *; style-src *; img-src *; connect-src *;"
  );

  if (!pool) {
    return res
      .status(500)
      .json({ message: "Database connection not initialized" });
  }
  req.db = pool;
  next();
});

// Configure microsoft graph
const CLIENT_ID = "3d310826-2173-44e5-b9a2-b21e940b67f7";
const TENANT_ID = "1c3de7f3-f8d1-41d3-8583-2517cf3ba3b1";
const CLIENT_SECRET = "2e78Q~yX92LfwTTOg4EYBjNQrXrZ2z5di1Kvebog";
const SENDER_EMAIL = "spot@premierenergies.com";

// Create an authentication credential for Microsoft Graph APIs
const credential = new ClientSecretCredential(
  TENANT_ID,
  CLIENT_ID,
  CLIENT_SECRET
);

// Create a Microsoft Graph client
const client = Client.initWithMiddleware({
  authProvider: {
    getAccessToken: async () => {
      const tokenResponse = await credential.getToken(
        "https://graph.microsoft.com/.default"
      );
      return tokenResponse.token;
    },
  },
});

// Function to send an email using Microsoft Graph API
async function sendEmail(toEmail, subject, content, attachments = []) {
  try {
    const message = {
      subject: subject,
      body: {
        contentType: "HTML",
        content: content,
      },
      toRecipients: [
        {
          emailAddress: {
            address: toEmail,
          },
        },
      ],
    };

    // If attachments were passed, add them to the message
    if (attachments && attachments.length > 0) {
      message.attachments = attachments.map((file) => ({
        "@odata.type": "#microsoft.graph.fileAttachment",
        Name: file.originalname, // the original file name
        ContentType: file.mimetype, // MIME type of the file
        ContentBytes: fs.readFileSync(file.path, { encoding: "base64" }),
      }));
    }

    await client
      .api(`/users/${SENDER_EMAIL}/sendMail`)
      .post({ message, saveToSentItems: "true" });

    console.log(`Email sent to ${toEmail}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

// API endpoint to handle OTP requests
// API endpoint to handle OTP requests
app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;
  const fullEmail = `${email}@premierenergies.com`;

  try {
    await sql.connect(dbConfig);

    // NEW: Check if an account already exists in Login table (LPassword is not null)
    const loginCheck =
      await sql.query`SELECT LPassword FROM Login WHERE Username = ${fullEmail}`;
    if (
      loginCheck.recordset.length > 0 &&
      loginCheck.recordset[0].LPassword !== null
    ) {
      return res.status(400).json({
        message:
          "An account associated with this email already exists, please login instead",
      });
    }

    // Query to check if email exists in EMP table and ActiveFlag is 1
    const result =
      await sql.query`SELECT EmpID FROM EMP WHERE EmpEmail = ${fullEmail} AND ActiveFlag = 1`;
    if (result.recordset.length > 0) {
      const empID = result.recordset[0].EmpID;

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiryTime = new Date(Date.now() + 5 * 60000); // 5 minutes from now

      // Insert or update OTP and expiry in Login table
      await sql.query`
          MERGE Login AS target
          USING (SELECT ${fullEmail} AS Username) AS source
          ON (target.Username = source.Username)
          WHEN MATCHED THEN 
            UPDATE SET OTP = ${otp}, OTP_Expiry = ${expiryTime}
          WHEN NOT MATCHED THEN
            INSERT (Username, OTP, OTP_Expiry, LEmpID)
            VALUES (${fullEmail}, ${otp}, ${expiryTime}, ${empID});
      `;

      // Send OTP via email
      const subject = "Your OTP Code";
      const content = `<p>Your OTP code is: <strong>${otp}</strong></p>`;
      await sendEmail(fullEmail, subject, content);

      res.status(200).json({ message: "OTP sent successfully" });
    } else {
      res
        .status(404)
        .json({
          message:
            "We do not have a @premierenergies email address registered for you. If you have a company email ID, please contact HR to get it updated or contact your manager to raise a ticket on your behalf.",
        });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// API endpoint to verify OTP
app.post("/api/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const fullEmail = `${email}@premierenergies.com`;

  try {
    // Connect to the database
    await sql.connect(dbConfig);

    // Query to verify OTP and check expiry
    const result = await sql.query`
        SELECT OTP, OTP_Expiry FROM Login WHERE Username = ${fullEmail} AND OTP = ${otp}
      `;

    if (result.recordset.length > 0) {
      const otpExpiry = result.recordset[0].OTP_Expiry;
      const currentTime = new Date();

      if (currentTime < otpExpiry) {
        // OTP is valid
        res.status(200).json({ message: "OTP verified successfully" });
      } else {
        // OTP has expired
        res
          .status(400)
          .json({ message: "OTP has expired. Please request a new one." });
      }
    } else {
      // OTP is incorrect
      res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// API endpoint to handle registration
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  const fullEmail = `${email}@premierenergies.com`;

  try {
    // Connect to the database
    await sql.connect(dbConfig);

    // Check if the account already exists (i.e. if LPassword is already set)
    const checkResult = await sql.query`
      SELECT LPassword FROM Login WHERE Username = ${fullEmail}
    `;
    if (
      checkResult.recordset.length > 0 &&
      checkResult.recordset[0].LPassword !== null
    ) {
      // Account already registered – do not update password, return an error
      return res.status(400).json({
        message: "An account already exists with this account",
      });
    }

    // Validate new password: minimum 8 characters, at least 1 number and 1 special character
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least one number and one special character.",
      });
    }

    // Otherwise update the password in the Login table (complete registration)
    await sql.query`
      UPDATE Login SET LPassword = ${password}
      WHERE Username = ${fullEmail}
    `;

    res.status(200).json({ message: "Registration completed successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// API endpoint to handle user login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const fullEmail = `${email}@premierenergies.com`;

  try {
    // Connect to the database
    await sql.connect(dbConfig);

    // Query to check if credentials match
    const result = await sql.query`
        SELECT * FROM Login WHERE Username = ${fullEmail} AND LPassword = ${password}
      `;

    if (result.recordset.length > 0) {
      // Credentials are correct
      res.status(200).json({
        message: "Login successful",
        empID: result.recordset[0].LEmpID,
      });
    } else {
      // Credentials are incorrect
      res
        .status(401)
        .json({ message: "Your Username or Password are incorrect" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get list of departments
app.get("/api/departments", async (req, res) => {
  try {
    await sql.connect(dbConfig);

    const result = await sql.query`SELECT DISTINCT Department FROM Assignee`;

    const departments = result.recordset.map((row) => row.Department);

    res.status(200).json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get list of subdepartments for a given department
app.get("/api/subdepartments", async (req, res) => {
  const { department } = req.query;

  try {
    await sql.connect(dbConfig);

    const result = await sql.query`
        SELECT DISTINCT SubDept FROM Assignee WHERE Department = ${department}
      `;

    const subDepartments = result.recordset.map((row) => row.SubDept);

    res.status(200).json(subDepartments);
  } catch (error) {
    console.error("Error fetching subdepartments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get list of subtasks for a given department and subdepartment
app.get("/api/subtasks", async (req, res) => {
  const { department, subdepartment } = req.query;

  try {
    await sql.connect(dbConfig);

    const result = await sql.query`
        SELECT DISTINCT SubTask FROM Assignee WHERE Department = ${department} AND SubDept = ${subdepartment}
      `;

    const subTasks = result.recordset.map((row) => row.SubTask);

    res.status(200).json(subTasks);
  } catch (error) {
    console.error("Error fetching subtasks:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get list of task labels for a given department, subdepartment, and subtask
app.get("/api/tasklabels", async (req, res) => {
  const { department, subdepartment, subtask } = req.query;

  try {
    await sql.connect(dbConfig);

    const result = await sql.query`
        SELECT DISTINCT Task_Label FROM Assignee WHERE Department = ${department} AND SubDept = ${subdepartment} AND SubTask = ${subtask}
      `;

    const taskLabels = result.recordset.map((row) => row.Task_Label);

    res.status(200).json(taskLabels);
  } catch (error) {
    console.error("Error fetching task labels:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// API endpoint to create a ticket
app.post(
  "/api/create-ticket",
  upload.array("attachments"),
  async (req, res) => {
    const {
      title,
      type,
      department,
      subDepartment,
      subTask,
      taskLabel,
      priority,
      description,
      reporterEmail,
    } = req.body;

    // Log files if provided
    if (req.files && req.files.length > 0) {
      console.log("Received attachments:", req.files);
    }
    // Choose the first attachment's filename if any
    const attachmentFile =
      req.files && req.files.length > 0 ? req.files[0].filename : null;

    const fullReporterEmail = `${reporterEmail}@premierenergies.com`;

    try {
      await sql.connect(dbConfig);

      console.log("Received ticket creation request with data:", {
        title,
        type,
        department,
        subDepartment,
        subTask,
        taskLabel,
        priority,
        description,
        reporterEmail,
        fullReporterEmail,
      });

      // Get reporter's details from EMP table
      const reporterResult = await sql.query`
        SELECT EmpID, EmpLocation, Dept, EmpName, EmpEmail 
        FROM EMP 
        WHERE EmpEmail = ${fullReporterEmail}
      `;

      console.log("Reporter query result:", reporterResult.recordset);

      if (reporterResult.recordset.length === 0) {
        console.error("Reporter not found in EMP table");
        return res
          .status(404)
          .json({ message: "Reporter not found in EMP table" });
      }

      const reporterEmpID = reporterResult.recordset[0].EmpID;
      const empLocation = reporterResult.recordset[0].EmpLocation;
      const reporterDept = reporterResult.recordset[0].Dept;
      const reporterName = reporterResult.recordset[0].EmpName;
      const reporterEmailFull = reporterResult.recordset[0].EmpEmail;

      console.log("Reporter details:", {
        reporterEmpID,
        empLocation,
        reporterDept,
        reporterName,
        reporterEmailFull,
      });

      // Determine Assignee_EmpID from Assignee table
      console.log("Querying Assignee table with criteria:", {
        empLocation,
        department,
        subDepartment,
        subTask,
        taskLabel,
      });

      const assigneeResult = await sql.query`
      SELECT Assignee_EmpID FROM Assignee
      WHERE EmpLocation = ${empLocation} 
        AND Department = ${department} 
        AND SubDept = ${subDepartment} 
        AND Subtask = ${subTask} 
        AND Task_Label = ${taskLabel} 
    `;

      console.log("Assignee query result:", assigneeResult.recordset);

      if (assigneeResult.recordset.length === 0) {
        console.error("No assignee found for the provided criteria");
        return res
          .status(404)
          .json({ message: "No assignee found for the provided criteria" });
      }

      const assigneeEmpID = assigneeResult.recordset[0].Assignee_EmpID;
      console.log("Assignee EmpID:", assigneeEmpID);

      // Get Assignee's Dept and SubDept from EMP table
      const assigneeDetailsResult = await sql.query`
          SELECT Dept AS Assignee_Dept, SubDept AS Assignee_SubDept 
          FROM EMP WHERE EmpID = ${assigneeEmpID}
        `;

      console.log("Assignee details:", assigneeDetailsResult.recordset);

      if (assigneeDetailsResult.recordset.length === 0) {
        console.error("Assignee not found in EMP table");
        return res
          .status(404)
          .json({ message: "Assignee not found in EMP table" });
      }

      const assigneeDept = assigneeDetailsResult.recordset[0].Assignee_Dept;
      const assigneeSubDept =
        assigneeDetailsResult.recordset[0].Assignee_SubDept;

      // Generate Ticket_Number
      const tPrefixResult = await sql.query`
        SELECT TPrefix FROM TNumber WHERE TSubDept = ${assigneeSubDept}
      `;

      if (tPrefixResult.recordset.length === 0) {
        console.error("TPrefix not found for the given SubDept");
        return res
          .status(404)
          .json({ message: "TPrefix not found for the given SubDept" });
      }

      const tPrefix = tPrefixResult.recordset[0].TPrefix;

      const creationDate = new Date();
      const creationDateStr = creationDate
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "");

      // New logic to fetch the last appended serial number and increment by one
      const lastTicketResult = await sql.query`
        SELECT TOP 1 Ticket_Number FROM Tickets
        WHERE Ticket_Number LIKE ${tPrefix + "_" + creationDateStr + "_%"}
        ORDER BY Ticket_Number DESC
      `;
      let newSerial;
      if (lastTicketResult.recordset.length === 0) {
        newSerial = 1;
      } else {
        const lastTicketNumber = lastTicketResult.recordset[0].Ticket_Number;
        const lastSerialStr = lastTicketNumber.slice(-3);
        newSerial = parseInt(lastSerialStr, 10) + 1;
      }
      const serialNumber = newSerial.toString().padStart(3, "0");

      const ticketNumber = `${tPrefix}_${creationDateStr}_${serialNumber}`;

      console.log("Generated Ticket Number:", ticketNumber);

      // **IMPORTANT:** Here we update the INSERT query to include the new "Attachment" column.
      // (You will need to add a nullable NVARCHAR column named "Attachment" to your Tickets table.)
      await sql.query`
          INSERT INTO Tickets (
            Ticket_Number,
            Creation_Date,
            Ticket_Type,
            Ticket_Title,
            Ticket_Description,
            Ticket_Priority,
            Assignee_Dept,
            Sub_Task,
            Task_Label,
            Assignee_EmpID,
            Reporter_Location,
            Reporter_Department,
            Reporter_EmpID,
            Reporter_Name,
            Reporter_Email,
            Attachment,
            Expected_Completion_Date,
            TStatus,
            Assignee_SubDept
          )
          VALUES (
            ${ticketNumber},
            GETDATE(),
            'Issue',
            ${title},
            ${description},
            ${priority},
            ${assigneeDept},
            ${subTask},
            ${taskLabel},
            ${assigneeEmpID},
            ${empLocation},
            ${reporterDept},
            ${reporterEmpID},
            ${reporterName},
            ${reporterEmailFull},
            ${attachmentFile},
            NULL,
            'In-Progress',
            ${assigneeSubDept}
          )
        `;

      console.log("Ticket inserted into Tickets table successfully.");

      // Send confirmation email to reporter
      const reporterSubject = "Ticket Created Successfully";
      const reporterContent = `<p>Your ticket has been created successfully with Ticket Number: ${ticketNumber}</p>`;
      await sendEmail(fullReporterEmail, reporterSubject, reporterContent);
      console.log(`Confirmation email sent to reporter: ${fullReporterEmail}`);

      // Get Assignee's email from EMP table
      const assigneeEmailResult = await sql.query`
          SELECT EmpEmail FROM EMP WHERE EmpID = ${assigneeEmpID}
        `;

      console.log(
        "Assignee email query result:",
        assigneeEmailResult.recordset
      );

      if (assigneeEmailResult.recordset.length === 0) {
        console.error("Assignee not found in EMP table");
        return res
          .status(404)
          .json({ message: "Assignee not found in EMP table" });
      }

      const assigneeEmail = assigneeEmailResult.recordset[0].EmpEmail;

      // Send email to assignee with attachments included
      const assigneeSubject = `New Ticket Assigned to You - ${title}`;
      const assigneeContent = `<p>A new ticket has been assigned to you with Ticket Number: ${ticketNumber}</p>
          <p>Details:</p>
          <p>Title: ${title}</p>
          <p>Description: ${description}</p>`;
      await sendEmail(
        assigneeEmail,
        assigneeSubject,
        assigneeContent,
        req.files || []
      );
      console.log(`Notification email sent to assignee: ${assigneeEmail}`);

      res
        .status(200)
        .json({ message: "Ticket created and emails sent successfully" });
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.use("/uploads", express.static("uploads"));

const autoCloseTickets = async () => {
  try {
    await sql.connect(dbConfig);

    const resolvedTicketsResult = await sql.query`
      SELECT Ticket_Number 
      FROM Tickets 
      WHERE TStatus = 'Resolved'
    `;
    const resolvedTickets = resolvedTicketsResult.recordset;

    const now = new Date();
    let closedCount = 0;

    for (const ticket of resolvedTickets) {

      const historyResult = await sql.query`
        SELECT TOP 1 Timestamp
        FROM History
        WHERE HTicket_Number = ${ticket.Ticket_Number}
          AND Action_Type = 'Status'
          AND After_State = 'Resolved'
        ORDER BY Timestamp DESC
      `;
      if (historyResult.recordset.length > 0) {
        const resolvedTime = new Date(historyResult.recordset[0].Timestamp);
        const diffDays = (now - resolvedTime) / (1000 * 60 * 60 * 24);

        if (diffDays > 7) {
          await sql.query`
            UPDATE Tickets
            SET TStatus = 'Closed'
            WHERE Ticket_Number = ${ticket.Ticket_Number}
          `;
          closedCount++;
        }
      }
    }
    console.log(`Auto-closed ${closedCount} ticket(s).`);
  } catch (error) {
    console.error("Error in auto-closing tickets:", error);
  }
};
setInterval(autoCloseTickets, 1 * 60 * 1000); 

// API endpoint to fetch user data
app.get("/api/user", async (req, res) => {
  const { email } = req.query;
  const fullEmail = `${email}@premierenergies.com`;

  try {
    // Now also select EmpLocation
    const result = await sql.query`
        SELECT EmpID, EmpName, Dept, EmpLocation FROM EMP WHERE EmpEmail = ${fullEmail}
      `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// In server.js, add this endpoint below your other API endpoints
app.post("/api/forgot-password", async (req, res) => {
  const { email, password } = req.body;
  const fullEmail = `${email}@premierenergies.com`;

  try {
    // Connect to the database (re‑using the same dbConfig and connection pool)
    await sql.connect(dbConfig);

    // Update the password in the Login table
    await sql.query`
      UPDATE Login SET LPassword = ${password}
      WHERE Username = ${fullEmail}
    `;

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//
app.get("/api/isAssignee", async (req, res) => {
  const { empID } = req.query;
  try {
    await sql.connect(dbConfig);
    const result =
      await sql.query`SELECT COUNT(*) as count FROM Assignee WHERE Assignee_EmpID = ${empID}`;
    const isAssignee = result.recordset[0].count > 0;
    res.status(200).json({ isAssignee });
  } catch (error) {
    console.error("Error checking assignee:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// API endpoint to fetch tickets
app.get("/api/tickets", async (req, res) => {
  const { mode, empID, department } = req.query;

  try {
    let ticketsResult;

    if (mode === "assignedToMe") {
      ticketsResult = await sql.query`
        SELECT 
          T.*, 
          A.EmpName AS Assignee_Name
        FROM Tickets T
        LEFT JOIN EMP A ON T.Assignee_EmpID = A.EmpID
        WHERE T.Assignee_EmpID = ${empID}
      `;
    } else if (mode === "assignedByMe") {
      ticketsResult = await sql.query`
        SELECT 
          T.*,
          E.EmpName AS Reporter_Name,
          A.EmpName AS Assignee_Name
        FROM Tickets T
        LEFT JOIN EMP E ON T.Reporter_EmpID = E.EmpID
        LEFT JOIN EMP A ON T.Assignee_EmpID = A.EmpID
        WHERE T.Reporter_EmpID = ${empID}
      `;
    } else if (mode === "assignedByDept") {
      // Tickets reported by the given department
      ticketsResult = await sql.query`
        SELECT 
          T.*,
          E.EmpName AS Reporter_Name,
          A.EmpName AS Assignee_Name
        FROM Tickets T
        LEFT JOIN EMP E ON T.Reporter_EmpID = E.EmpID
        LEFT JOIN EMP A ON T.Assignee_EmpID = A.EmpID
        WHERE T.Reporter_Department = ${department}
      `;
    } else if (mode === "assignedToDept") {
      // Tickets assigned to the given department
      ticketsResult = await sql.query`
        SELECT 
          T.*,
          E.EmpName AS Reporter_Name,
          A.EmpName AS Assignee_Name
        FROM Tickets T
        LEFT JOIN EMP E ON T.Reporter_EmpID = E.EmpID
        LEFT JOIN EMP A ON T.Assignee_EmpID = A.EmpID
        WHERE T.Assignee_Dept = ${department}
      `;
    } else {
      return res.status(400).json({ message: "Invalid mode" });
    }

    const tickets = ticketsResult.recordset;

    // Calculate current status counts
    const statusCounts = tickets.reduce(
      (acc, ticket) => {
        acc.total += 1;

        if (!ticket.Expected_Completion_Date) {
          acc.unassigned += 1;
        }

        const status = ticket.TStatus ? ticket.TStatus.toLowerCase() : "";
        if (status === "in-progress") acc.inProgress += 1;
        else if (status === "overdue") acc.overdue += 1;
        else if (status === "resolved") acc.resolved += 1;
        else if (status === "closed") acc.closed += 1;
        return acc;
      },
      {
        total: 0,
        inProgress: 0,
        overdue: 0,
        resolved: 0,
        closed: 0,
        unassigned: 0,
      }
    );

    // Build query for previous day tickets based on mode
    let previousTicketsQuery;
    if (mode === "assignedToMe") {
      previousTicketsQuery = sql.query`
        SELECT T.TStatus, T.Expected_Completion_Date
        FROM Tickets T
        WHERE T.Assignee_EmpID = ${empID} AND T.Creation_Date < CAST(GETDATE() AS DATE)
      `;
    } else if (mode === "assignedByMe") {
      previousTicketsQuery = sql.query`
        SELECT T.TStatus, T.Expected_Completion_Date
        FROM Tickets T
        WHERE T.Reporter_EmpID = ${empID} AND T.Creation_Date < CAST(GETDATE() AS DATE)
      `;
    } else if (mode === "assignedByDept") {
      previousTicketsQuery = sql.query`
        SELECT T.TStatus, T.Expected_Completion_Date
        FROM Tickets T
        WHERE T.Reporter_Department = ${department} AND T.Creation_Date < CAST(GETDATE() AS DATE)
      `;
    } else if (mode === "assignedToDept") {
      previousTicketsQuery = sql.query`
        SELECT T.TStatus, T.Expected_Completion_Date
        FROM Tickets T
        WHERE T.Assignee_Dept = ${department} AND T.Creation_Date < CAST(GETDATE() AS DATE)
      `;
    }

    const previousTicketsResult = previousTicketsQuery
      ? await previousTicketsQuery
      : { recordset: [] };

    const previousTickets = previousTicketsResult.recordset;

    // Calculate previous status counts
    const previousStatusCounts = previousTickets.reduce(
      (acc, ticket) => {
        acc.total += 1;

        if (!ticket.Expected_Completion_Date) {
          acc.unassigned += 1;
        }

        const status = ticket.TStatus ? ticket.TStatus.toLowerCase() : "";
        if (status === "in-progress") acc.inProgress += 1;
        else if (status === "overdue") acc.overdue += 1;
        else if (status === "resolved") acc.resolved += 1;
        else if (status === "closed") acc.closed += 1;
        return acc;
      },
      {
        total: 0,
        inProgress: 0,
        overdue: 0,
        resolved: 0,
        closed: 0,
        unassigned: 0,
      }
    );

    res.status(200).json({ tickets, statusCounts, previousStatusCounts });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get list of employees for a given department and subdepartment
app.get("/api/employees", async (req, res) => {
  const { department, subdepartment } = req.query;

  try {
    const result = await sql.query`
      SELECT EmpID, EmpName, EmpLocation FROM EMP WHERE Dept = ${department} AND SubDept = ${subdepartment}
    `;

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Server error" });
  }
});

const updateTicketDetails = async (ticketData) => {
  const {
    Ticket_Number,
    Expected_Completion_Date,
    Ticket_Priority,
    TStatus,
    Assignee_Dept,
    Assignee_SubDept,
    Assignee_EmpID,
  } = ticketData;

  // Update the ticket
  await sql.query`
    UPDATE Tickets
    SET
      Expected_Completion_Date = ${Expected_Completion_Date || null},
      Ticket_Priority = ${Ticket_Priority || null},
      TStatus = ${TStatus || null},
      Assignee_Dept = ${Assignee_Dept || null},
      Assignee_SubDept = ${Assignee_SubDept || null},
      Assignee_EmpID = ${Assignee_EmpID || null}
    WHERE Ticket_Number = ${Ticket_Number}
  `;
};

const getOriginalTicket = async (Ticket_Number) => {
  const result = await sql.query`
    SELECT 
      Expected_Completion_Date, 
      Ticket_Priority, 
      TStatus, 
      Assignee_Dept, 
      Assignee_SubDept, 
      Assignee_EmpID 
    FROM Tickets
    WHERE Ticket_Number = ${Ticket_Number}
  `;

  if (result.recordset.length === 0) {
    throw new Error("Ticket not found");
  }

  return result.recordset[0];
};

const generateHistoryChanges = (originalTicket, newTicket, UserID, Comment) => {
  const changes = [];
  const fields = [
    {
      field: "Expected_Completion_Date",
      actionType: "Expected Completion Date",
      defaultComment: "Updated Expected Completion Date",
    },
    {
      field: "Ticket_Priority",
      actionType: "Priority",
      defaultComment: "Updated Priority",
    },
    {
      field: "TStatus",
      actionType: "Status",
      defaultComment: "Updated Status",
    },
    {
      field: "Assignee_Dept",
      actionType: "Assignee Department",
      defaultComment: "Updated Assignee Department",
    },
    {
      field: "Assignee_SubDept",
      actionType: "Assignee Sub-Department",
      defaultComment: "Updated Assignee Sub-Department",
    },
    {
      field: "Assignee_EmpID",
      actionType: "Assignee Employee",
      defaultComment: "Updated Assignee Employee",
    },
  ];

  for (const { field, actionType, defaultComment } of fields) {
    if (originalTicket[field] !== newTicket[field]) {
      changes.push({
        HTicket_Number: newTicket.Ticket_Number,
        UserID,
        Comment: Comment || defaultComment,
        Action_Type: actionType,
        Before_State: originalTicket[field],
        After_State: newTicket[field],
      });
    }
  }

  return changes;
};

const insertHistoryRecords = async (changes) => {
  for (const change of changes) {
    await sql.query`
      INSERT INTO History (
        HTicket_Number,
        UserID,
        Comment,
        Action_Type,
        Before_State,
        After_State,
        Timestamp,
        IsRead
      ) VALUES (
        ${change.HTicket_Number},
        ${change.UserID},
        ${change.Comment},
        ${change.Action_Type},
        ${change.Before_State || null},
        ${change.After_State || null},
        GETDATE(),
        0
      )
    `;
  }
};

// Helper function to get ticket details including reporter and assignee emails
async function getTicketDetails(ticketNumber) {
  const ticketRes = await sql.query`
    SELECT T.*, E.EmpEmail AS ReporterEmail, A.EmpEmail AS AssigneeEmail
    FROM Tickets T
    LEFT JOIN EMP E ON T.Reporter_EmpID = E.EmpID
    LEFT JOIN EMP A ON T.Assignee_EmpID = A.EmpID
    WHERE T.Ticket_Number = ${ticketNumber}
  `;
  if (ticketRes.recordset.length === 0) throw new Error("Ticket not found");
  return ticketRes.recordset[0];
}

// Helper function to send emails on status or completion date changes
async function sendStatusChangeEmail(ticketNumber, changes) {
  // Get updated ticket details
  const ticketDetails = await getTicketDetails(ticketNumber);

  // Check which fields changed
  const changedFields = changes.map((c) => c.Action_Type);

  // If status changed, handle special logic
  if (changedFields.includes("Status")) {
    const newStatusChange = changes.find((c) => c.Action_Type === "Status");
    const newStatus = newStatusChange.After_State;

    if (newStatus === "Resolved") {
      // Send email to reporter with accept/reject instructions
      const subject = `Ticket ${ticketNumber} Resolved`;
      const content = `
        <p>Your ticket <strong>${ticketNumber}</strong> has been marked as Resolved.</p>
        <p>Please <strong>login to the system</strong> and Accept or Reject the resolution.</p>
        <p>If you take no action within 7 days, the ticket will be auto-closed.</p>
      `;
      await sendEmail(ticketDetails.ReporterEmail, subject, content);
    } else if (newStatus === "Closed") {
      // Email to reporter that ticket is closed
      const subject = `Ticket ${ticketNumber} Closed`;
      const content = `<p>Your ticket <strong>${ticketNumber}</strong> is now Closed.</p>`;
      await sendEmail(ticketDetails.ReporterEmail, subject, content);
    } else if (newStatus === "In-Progress") {
      // Ticket reverted back to In-Progress (after rejection)
      // Notify assignee
      const subject = `Ticket ${ticketNumber} has been re-opened`;
      const content = `
        <p>The resolution for ticket <strong>${ticketNumber}</strong> has not been accepted by the reporter.</p>
        <p>Please review and address the issue again.</p>
      `;
      await sendEmail(ticketDetails.AssigneeEmail, subject, content);
    }
  }

  // If Expected Completion Date changed
  if (changedFields.includes("Expected Completion Date")) {
    // Notify assignee or reporter, depending on your business logic.
    // For example, notify the assignee:
    const subject = `Ticket ${ticketNumber} Expected Completion Date Updated`;
    const content = `
      <p>The expected completion date for ticket <strong>${ticketNumber}</strong> has been updated.</p>
      <p>Please review the ticket details.</p>
    `;
    await sendEmail(ticketDetails.AssigneeEmail, subject, content);
  }

  // If Assignee changed
  const assigneeFields = [
    "Assignee Department",
    "Assignee Sub-Department",
    "Assignee Employee",
  ];
  const assigneeChanged = changedFields.some((field) =>
    assigneeFields.includes(field)
  );
  if (assigneeChanged) {
    const subject = `Ticket ${ticketNumber} Assignee Updated`;
    const content = `
      <p>The assignee for ticket <strong>${ticketNumber}</strong> has been updated.</p>
      <p>Please review the ticket details.</p>
    `;
    await sendEmail(ticketDetails.AssigneeEmail, subject, content);
  }
}

// Main endpoint handler
app.post("/api/update-ticket", async (req, res) => {
  try {
    // Step 1: Validate user exists (to prevent foreign key violation)
    const userExists = await sql.query`
      SELECT COUNT(*) as count FROM Login WHERE Username = ${req.body.UserID}
    `;

    if (userExists.recordset[0].count === 0) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Step 2: Get original ticket data
    const originalTicket = await getOriginalTicket(req.body.Ticket_Number);

    // Step 3: Update ticket details
    await updateTicketDetails(req.body);

    // Step 4: Generate history changes
    const changes = generateHistoryChanges(
      originalTicket,
      req.body,
      req.body.UserID,
      req.body.Comment
    );

    // Step 5: Insert history records
    await insertHistoryRecords(changes);

    // Step 6: Send emails if status or expected completion date changed, or if assignee updated
    const statusOrDateOrAssigneeChanged = changes.some(
      (c) =>
        c.Action_Type === "Status" ||
        c.Action_Type === "Expected Completion Date" ||
        c.Action_Type === "Assignee Department" ||
        c.Action_Type === "Assignee Sub-Department" ||
        c.Action_Type === "Assignee Employee"
    );
    if (statusOrDateOrAssigneeChanged) {
      await sendStatusChangeEmail(req.body.Ticket_Number, changes);
    }

    res.status(200).json({ message: "Ticket updated successfully" });
  } catch (error) {
    console.error("Error updating ticket:", error);

    if (error.message === "Ticket not found") {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({ message: "Server error" });
  }
});

/******************************************/
/** PRODUCTION-READY RESPOND-RESOLUTION ENDPOINT **/
/******************************************/
app.post("/api/tickets/respond-resolution", async (req, res) => {
  try {
    const { ticketNumber, action, userID } = req.body;

    // 1) Validate user exists
    const userExists = await sql.query`
      SELECT COUNT(*) as count 
      FROM Login 
      WHERE Username = ${userID}
    `;
    if (userExists.recordset[0].count === 0) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // 2) Fetch the current ticket
    const ticketRes = await sql.query`
      SELECT TStatus 
      FROM Tickets 
      WHERE Ticket_Number = ${ticketNumber}
    `;
    if (ticketRes.recordset.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    const currentStatus = ticketRes.recordset[0].TStatus;

    // 3) Decide the new status based on 'action'
    //    For example, only allow "accept" or "reject" if currentStatus == "Resolved"
    //    Adjust logic if your business rules differ.
    if (currentStatus !== "Resolved") {
      return res
        .status(400)
        .json({ message: "Ticket must be in 'Resolved' status first." });
    }

    let newStatus;
    if (action === "accept") {
      newStatus = "Closed";
    } else if (action === "reject") {
      newStatus = "In-Progress";
    } else {
      return res
        .status(400)
        .json({ message: "Invalid action. Use 'accept' or 'reject'." });
    }

    // 4) Update the ticket in DB
    const originalTicket = await getOriginalTicket(ticketNumber);

    await sql.query`
      UPDATE Tickets
      SET TStatus = ${newStatus}
      WHERE Ticket_Number = ${ticketNumber}
    `;

    // 5) Insert a record into History table
    //    We'll mark the "Before_State" as the old TStatus and "After_State" as the new TStatus.
    const changes = [
      {
        HTicket_Number: ticketNumber,
        UserID: userID,
        Comment:
          action === "accept"
            ? "Resolution accepted"
            : "Resolution rejected. Ticket reopened",
        Action_Type: "Status",
        Before_State: originalTicket.TStatus,
        After_State: newStatus,
      },
    ];
    await insertHistoryRecords(changes);

    // 6) Send notifications (uses your existing logic)
    await sendStatusChangeEmail(ticketNumber, changes);

    return res.status(200).json({
      message:
        action === "accept"
          ? "Ticket has been closed."
          : "Ticket has been re-opened (In-Progress).",
    });
  } catch (error) {
    console.error("Error in /api/tickets/respond-resolution:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// New route: Auto-close tickets that have remained in "Resolved" state for 7+ days
app.post("/api/auto-close-tickets", async (req, res) => {
  try {
    // Ensure a connection is established
    await sql.connect(dbConfig);

    // Get all tickets that are still "Resolved"
    const resolvedTicketsResult = await sql.query`
      SELECT Ticket_Number 
      FROM Tickets 
      WHERE TStatus = 'Resolved'
    `;
    const resolvedTickets = resolvedTicketsResult.recordset;

    const now = new Date();
    let closedCount = 0;

    // Loop over each resolved ticket
    for (const ticket of resolvedTickets) {
      // Find the latest history record when the ticket status was set to "Resolved"
      const historyResult = await sql.query`
        SELECT TOP 1 Timestamp
        FROM History
        WHERE HTicket_Number = ${ticket.Ticket_Number}
          AND Action_Type = 'Status'
          AND After_State = 'Resolved'
        ORDER BY Timestamp DESC
      `;
      if (historyResult.recordset.length > 0) {
        const resolvedTime = new Date(historyResult.recordset[0].Timestamp);
        const diffDays = (now - resolvedTime) / (1000 * 60 * 60 * 24);
        // If at least 7 days have passed, update the ticket status to "Closed"
        if (diffDays >= 7) {
          await sql.query`
            UPDATE Tickets
            SET TStatus = 'Closed'
            WHERE Ticket_Number = ${ticket.Ticket_Number}
          `;
          closedCount++;
        }
      }
    }
    res.status(200).json({ message: `Auto-closed ${closedCount} ticket(s).` });
  } catch (error) {
    console.error("Error in auto-closing tickets:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// API endpoint to fetch notifications
app.get("/api/notifications", async (req, res) => {
  const { userID, filter } = req.query; // 'filter' can be 'all', 'read', 'unread'

  try {
    // Get the EmpID of the user
    const userResult = await sql.query`
      SELECT EmpID FROM EMP WHERE EmpEmail = ${userID}
    `;
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const empID = userResult.recordset[0].EmpID;

    // Find tickets where the user is the Assignee_EmpID or Reporter_EmpID
    const ticketsResult = await sql.query`
      SELECT Ticket_Number FROM Tickets WHERE Assignee_EmpID = ${empID} OR Reporter_EmpID = ${empID}
    `;
    const ticketNumbers = ticketsResult.recordset.map(
      (row) => row.Ticket_Number
    );

    if (ticketNumbers.length === 0) {
      return res.status(200).json({
        notifications: [],
        counts: { all: 0, read: 0, unread: 0 },
      });
    }

    // Build the IN clause with parameters
    const ticketNumbersParams = ticketNumbers
      .map((_, index) => `@ticket${index}`)
      .join(", ");
    const request = new sql.Request();
    ticketNumbers.forEach((ticketNum, index) => {
      request.input(`ticket${index}`, sql.NVarChar(50), ticketNum);
    });

    // Exclude notifications where the action was performed by the user himself
    request.input("userID", sql.NVarChar(255), userID);

    // Build the base SQL query
    let baseQuery = `
      SELECT H.*, H.UserID AS UserName
      FROM History H
      WHERE H.HTicket_Number IN (${ticketNumbersParams}) AND H.UserID <> @userID
    `;

    // Get notifications based on the filter
    let historyQuery = baseQuery;
    if (filter === "read") {
      historyQuery += ` AND H.IsRead = 1 `;
    } else if (filter === "unread") {
      historyQuery += ` AND H.IsRead = 0 `;
    }

    historyQuery += ` ORDER BY H.Timestamp DESC `;

    const historyResult = await request.query(historyQuery);

    // Get counts for all, read, and unread notifications
    const countsQuery = `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN H.IsRead = 1 THEN 1 ELSE 0 END) AS readCount,
        SUM(CASE WHEN H.IsRead = 0 THEN 1 ELSE 0 END) AS unreadCount
      FROM History H
      WHERE H.HTicket_Number IN (${ticketNumbersParams}) AND H.UserID <> @userID
    `;
    const countsResult = await request.query(countsQuery);
    const counts = countsResult.recordset[0];

    res.status(200).json({
      notifications: historyResult.recordset,
      counts: {
        all: counts.total,
        read: counts.readCount,
        unread: counts.unreadCount,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint to mark notifications as read
app.post("/api/notifications/mark-read", async (req, res) => {
  const {
    userID,
    HTicket_Number,
    Comment,
    Action_Type,
    Before_State,
    After_State,
    Timestamp,
  } = req.body; // notification details

  try {
    // Convert Timestamp to valid JavaScript Date object
    const parsedTimestamp = new Date(Timestamp);
    if (isNaN(parsedTimestamp.getTime())) {
      return res.status(400).json({ message: "Invalid Timestamp format" });
    }

    // Establish a database connection
    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    // Prepare the query to mark the notification as read
    let updateQuery = `
      UPDATE History
      SET IsRead = 1
      WHERE HTicket_Number = @HTicket_Number
        AND UserID = @UserID
        AND Comment = @Comment
        AND Action_Type = @Action_Type
        AND Before_State = @Before_State
        AND After_State = @After_State
        AND Timestamp = @Timestamp
    `;

    // Add parameters for the update query
    request.input("HTicket_Number", sql.NVarChar(50), HTicket_Number);
    request.input("UserID", sql.NVarChar(255), userID);
    request.input("Comment", sql.NVarChar(255), Comment);
    request.input("Action_Type", sql.NVarChar(50), Action_Type);
    request.input("Before_State", sql.NVarChar(255), Before_State);
    request.input("After_State", sql.NVarChar(255), After_State);
    request.input("Timestamp", sql.DateTime, parsedTimestamp);

    // Execute the update query
    const result = await request.query(updateQuery);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: "Notification marked as read" });
    } else {
      res.status(404).json({ message: "Notification not found" });
    }
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// endpoint to fetch ticket history
app.get("/api/ticket-history", async (req, res) => {
  const { ticketNumber } = req.query;

  if (!ticketNumber) {
    return res.status(400).json({ message: "Ticket number is required" });
  }

  try {
    const result = await sql.query`
      SELECT HTicket_Number, UserID, Comment, Action_Type, Before_State, After_State, Timestamp 
      FROM History
      WHERE HTicket_Number = ${ticketNumber}
      ORDER BY Timestamp DESC
    `;

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching ticket history:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint to check if a user is an HOD
app.get("/api/isHOD", async (req, res) => {
  const { empID } = req.query;

  try {
    const result = await sql.query`
      SELECT TOP 1 1 FROM HOD WHERE HODID = ${empID}
    `;

    if (result.recordset.length > 0) {
      res.status(200).json({ isHOD: true });
    } else {
      res.status(200).json({ isHOD: false });
    }
  } catch (error) {
    console.error("Error checking HOD:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/getHODForDept", async (req, res) => {
  const { dept } = req.query;
  try {
    const result = await sql.query`
      SELECT HODID FROM HOD WHERE Dept = ${dept}
    `;
    if (result.recordset.length > 0) {
      res.status(200).json({ HODID: result.recordset[0].HODID });
    } else {
      res.status(200).json({ HODID: null });
    }
  } catch (error) {
    console.error("Error fetching HODID for department:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout endpoint
app.post("/api/logout", (req, res) => {
  // Invalidate session here if applicable.
  res.status(200).json({ message: "Logout successful" });
});

// Endpoint to fetch all employees in the logged-in user's department
app.get("/api/team-structure", async (req, res) => {
  const { empID } = req.query;

  if (!empID) {
    return res.status(400).json({ message: "Employee ID is required" });
  }

  try {
    // Fetch details of the logged-in user
    const userQuery = await sql.query`
      SELECT EmpID, EmpName, Dept FROM EMP WHERE EmpID = ${empID}
    `;
    if (userQuery.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const loggedInUser = userQuery.recordset[0];

    // Fetch all employees in the same department
    const departmentQuery = await sql.query`
      SELECT EmpID, EmpName 
      FROM EMP 
      WHERE Dept = ${loggedInUser.Dept}
      ORDER BY EmpName
    `;
    const employees = departmentQuery.recordset;

    res.status(200).json({ employees });
  } catch (error) {
    console.error("Error fetching team structure:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"));
});

// HTTPS Deployment Section
const PORT = process.env.PORT || 443; // Using port 3000 for both frontend and backend now
const HOST = process.env.HOST || "0.0.0.0";

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, "certs", "mydomain.key"), "utf8"),
  cert: fs.readFileSync(
    path.join(__dirname, "certs", "d466aacf3db3f299.crt"),
    "utf8"
  ),
  ca: fs.readFileSync(
    path.join(__dirname, "certs", "gd_bundle-g2-g1.crt"),
    "utf8"
  ),
};

const startServer = async () => {
  try {
    await initializeDatabase();
    https.createServer(httpsOptions, app).listen(PORT, HOST, () => {
      console.log(`HTTPS Server running at https://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1);
  }
};

startServer();
