const express = require("express");
const cors = require("cors");
const sql = require("mssql");
const dotenv = require("dotenv");
const { Client } = require("@microsoft/microsoft-graph-client");
const { ClientSecretCredential } = require("@azure/identity");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const http = require("http");
const https = require("https");
const fs = require("fs");
require("isomorphic-fetch");

dotenv.config();

const app = express();

const path = require("path");

const allowedOrigins = [
  "http://localhost:3000",
  "https://spot.premierenergies.com:10443",
  "https://digi.premierenergies.com",
  "https://14.194.111.58:3000",
];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "client", "build")));

// Database configuration
const dbConfig = {
  user: "SPOT_USER",
  password: "Marvik#72@",
  server: "10.0.40.10",
  port: 1433,
  database: "SPOT_2",
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

// ── SESSION CHECK FOR FRONTEND ─────────────────────────────────────────────────
// (so React can read /api/session if you choose—but SPOT keeps its own login)
app.get("/api/session", (req, res) => {
  // SPOT doesn’t use server-side sessions here, but you could mirror DIGI if needed
  res.json({ loggedIn: false });
});

// API endpoint to handle OTP requests
// API endpoint to handle OTP requests
app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;
  const fullEmail = `${email}@premierenergies.com`;

  try {
    await sql.connect(dbConfig);

    // Query to check if email exists in EMP table and ActiveFlag is 1
    const result =
      await sql.query`SELECT EmpID FROM EMP WHERE EmpEmail = ${fullEmail} AND ActiveFlag = 1`;
    if (result.recordset.length > 0) {
      const empID = result.recordset[0].EmpID;

      // Generate a 4-digit OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
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

      // Send OTP via email with a more formal template
      const subject =
        "Premier Energies Ticketing Tool – Your OTP";
      const content = `
              <p>Welcome to the Premier Energies Ticketing Tool!</p>
              <p>Your One‑Time Password (OTP) is: <strong>${otp}</strong></p>
              <p>This OTP will expire in 5 minutes.</p>
              <p>Thanks &amp; Regards,<br/>Team SPOT</p>
            `;
      await sendEmail(fullEmail, subject, content);

      res.status(200).json({ message: "OTP sent successfully" });
    } else {
      res.status(404).json({
        message:
          "We do not have a @premierenergies email address registered for you. If you have a company email ID, please contact HR to get it updated or contact your manager to raise a ticket on your behalf.",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// send‐otp for *forgot password* flow:
app.post("/api/send-otp-reset", async (req, res) => {
  const { email } = req.body;
  const fullEmail = `${email}@premierenergies.com`;

  try {
    await sql.connect(dbConfig);

    // 1) Make sure an account *does* already exist (i.e. LPassword is set)
    const loginCheck = await sql.query`
      SELECT LPassword 
      FROM Login 
      WHERE Username = ${fullEmail}
    `;
    if (
      loginCheck.recordset.length === 0 ||
      loginCheck.recordset[0].LPassword === null
    ) {
      return res.status(404).json({
        message: "No account found with that email. Please register first.",
      });
    }

    // 2) Confirm they’re in the EMP table and ActiveFlag = 1
    const empResult = await sql.query`
      SELECT EmpID 
      FROM EMP 
      WHERE EmpEmail = ${fullEmail} 
        AND ActiveFlag = 1
    `;
    if (empResult.recordset.length === 0) {
      return res.status(404).json({
        message:
          "We do not have a @premierenergies email address registered for you. If you have a company email ID, please contact HR.",
      });
    }
    const empID = empResult.recordset[0].EmpID;

    // 3) Generate & store a fresh OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiryTime = new Date(Date.now() + 5 * 60000);
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

    // 4) Email it with the same formal template
    const subject = "Premier Energies Ticketing Tool – Password Reset OTP";
    const content = `
          <p>Welcome back to the Premier Energies Ticketing Tool!</p>
          <p>Your One‑Time Password (OTP) for resetting your password is: <strong>${otp}</strong></p>
          <p>This OTP will expire in 5 minutes.</p>
          <p>Thanks &amp; Regards,<br/>Team SPOT</p>
        `;
    await sendEmail(fullEmail, subject, content);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error in /api/send-otp-reset:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Categories CRUD ---
app.get("/api/categories", async (req, res) => {
  const { recordset } = await req.db
    .request()
    .query(
      "SELECT CategoryID as id, CategoryName as name FROM Categories ORDER BY CategoryName"
    );
  res.json(recordset);
});

app.post("/api/categories", async (req, res) => {
  const { name } = req.body;
  await req.db
    .request()
    .input("name", sql.NVarChar(100), name)
    .query("INSERT INTO Categories (CategoryName) VALUES (@name)");
  res.status(201).end();
});

app.put("/api/categories/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  await req.db
    .request()
    .input("id", sql.Int, id)
    .input("name", sql.NVarChar(100), name)
    .query("UPDATE Categories SET CategoryName = @name WHERE CategoryID = @id");
  res.status(204).end();
});

app.delete("/api/categories/:id", async (req, res) => {
  const { id } = req.params;
  await req.db
    .request()
    .input("id", sql.Int, id)
    .query("DELETE FROM Categories WHERE CategoryID = @id");
  res.status(204).end();
});

// --- Subcategories CRUD ---
app.get("/api/subcategories", async (req, res) => {
  const { categoryId } = req.query;
  const { recordset } = await req.db
    .request()
    .input("cid", sql.Int, categoryId)
    .query(
      "SELECT SubcategoryID as id, SubcategoryName as name FROM Subcategories WHERE CategoryID = @cid ORDER BY SubcategoryName"
    );
  res.json(recordset);
});

// ── Categories + Subcategories hierarchy ─────────────────────────────────────
app.get("/api/categories-with-subcategories", async (req, res) => {
  try {
    // fetch all categories and their subcategories
    const result = await req.db.request().query(`
        SELECT
          c.CategoryID   AS categoryId,
          c.CategoryName AS categoryName,
          s.SubcategoryID   AS subcategoryId,
          s.SubcategoryName AS subcategoryName
        FROM Categories c
        LEFT JOIN Subcategories s
          ON c.CategoryID = s.CategoryID
        ORDER BY c.CategoryName, s.SubcategoryName;
      `);

    // group into hierarchy
    const rows = result.recordset;
    const map = new Map();

    for (const {
      categoryId,
      categoryName,
      subcategoryId,
      subcategoryName,
    } of rows) {
      if (!map.has(categoryId)) {
        map.set(categoryId, {
          id: categoryId,
          name: categoryName,
          subcategories: [],
        });
      }
      if (subcategoryId != null) {
        map.get(categoryId).subcategories.push({
          id: subcategoryId,
          name: subcategoryName,
        });
      }
    }

    // return as array
    res.json(Array.from(map.values()));
  } catch (err) {
    console.error("Error fetching category hierarchy:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── Departments + Sub‑Departments from Assignees ─────────────────────────────
app.get("/api/assignee-categories", async (req, res) => {
  try {
    // grab every (Department, SubDept) combo
    const { recordset } = await req.db.request().query(`
      SELECT DISTINCT
        Department   AS category,
        SubDept      AS subcategory
      FROM Assignees
      ORDER BY Department, SubDept;
    `);

    // group into a hierarchy: { category: [ subcategory, … ] }
    const map = new Map();
    for (const { category, subcategory } of recordset) {
      if (!map.has(category)) {
        map.set(category, new Set());
      }
      if (subcategory) {
        map.get(category).add(subcategory);
      }
    }

    // format as array of { category, subcategories: […] }
    const result = Array.from(map.entries()).map(([category, subs]) => ({
      category,
      subcategories: Array.from(subs),
    }));

    res.json(result);
  } catch (err) {
    console.error("Error fetching assignee‐mapping categories:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── SubTasks + Task_Labels from Assignees ────────────────────────────────────
app.get("/api/assignee-subtasks", async (req, res) => {
  const { department, subdept } = req.query;
  try {
    // pull every SubTask / Task_Label combo for that dept + subdept
    const request = req.db
      .request()
      .input("dept", sql.NVarChar(100), department || "")
      .input("sd", sql.NVarChar(100), subdept || "");
    const { recordset } = await request.query(`
      SELECT DISTINCT
        SubTask    AS subtask,
        Task_Label AS taskLabel
      FROM Assignees
      WHERE (@dept = '' OR Department = @dept)
        AND (@sd   = '' OR SubDept    = @sd)
      ORDER BY SubTask, Task_Label;
    `);

    // group into hierarchy: { subtask, taskLabels: [...] }
    const map = new Map();
    for (const { subtask, taskLabel } of recordset) {
      if (!map.has(subtask)) {
        map.set(subtask, []);
      }
      if (taskLabel) {
        map.get(subtask).push(taskLabel);
      }
    }

    // format as array
    const result = Array.from(map.entries()).map(([subtask, labels]) => ({
      subtask,
      taskLabels: labels,
    }));

    res.json(result);
  } catch (err) {
    console.error("Error fetching SubTasks + Task_Labels:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// === replace or move this into your list of endpoints ===
app.get("/api/ticket-locations", async (req, res) => {
  const { companyCode } = req.query;
  if (!companyCode) {
    return res
      .status(400)
      .json({ message: "companyCode query parameter is required" });
  }

  try {
    const result = await req.db
      .request()
      .input("companyCode", sql.Int, companyCode).query(`
        SELECT 
          LocationID, 
          LocationName 
        FROM dbo.Locations
        WHERE CompanyCode = @companyCode
        ORDER BY LocationName
      `);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error fetching locations:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/subcategories", async (req, res) => {
  const { categoryId, name } = req.body;
  await req.db
    .request()
    .input("cid", sql.Int, categoryId)
    .input("name", sql.NVarChar(100), name)
    .query(
      "INSERT INTO Subcategories (CategoryID, SubcategoryName) VALUES (@cid, @name)"
    );
  res.status(201).end();
});

app.put("/api/subcategories/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  await req.db
    .request()
    .input("id", sql.Int, id)
    .input("name", sql.NVarChar(100), name)
    .query(
      "UPDATE Subcategories SET SubcategoryName = @name WHERE SubcategoryID = @id"
    );
  res.status(204).end();
});

app.delete("/api/subcategories/:id", async (req, res) => {
  const { id } = req.params;
  await req.db
    .request()
    .input("id", sql.Int, id)
    .query("DELETE FROM Subcategories WHERE SubcategoryID = @id");
  res.status(204).end();
});

// API endpoint to verify OTP
app.post("/api/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const fullEmail = `${email}@premierenergies.com`;

  try {
    const result = await sql.query`
      SELECT OTP, OTP_Expiry, LEmpID 
      FROM Login 
      WHERE Username = ${fullEmail} AND OTP = ${otp}
    `;
    if (result.recordset.length === 0) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    const { OTP_Expiry, LEmpID } = result.recordset[0];
    if (new Date() > OTP_Expiry) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }
    // success → return empID
    return res.status(200).json({
      message: "OTP verified successfully",
      empID: LEmpID,
    });
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

    const result = await sql.query`SELECT DISTINCT Department FROM Assignees`;

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
        SELECT DISTINCT SubDept FROM Assignees WHERE Department = ${department}
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
        SELECT DISTINCT SubTask FROM Assignees WHERE Department = ${department} AND SubDept = ${subdepartment}
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
        SELECT DISTINCT Task_Label FROM Assignees WHERE Department = ${department} AND SubDept = ${subdepartment} AND SubTask = ${subtask}
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
      department,
      subDepartment,
      subTask,
      taskLabel,
      priority,
      description,
      reporterEmail,
      createdForEmail,
      incidentReportedDate,
      incidentReportedTime,
      location: selectedLocation,
    } = req.body;

    // Determine which username to use as reporter
    const reporterUsername = createdForEmail
      ? createdForEmail.trim()
      : reporterEmail.trim();

    // Build the full email address
    const fullReporterEmail = reporterUsername.includes("@")
      ? reporterUsername
      : `${reporterUsername}@premierenergies.com`;

    // Save attachments
    const attachmentFile =
      req.files && req.files.length > 0 ? req.files[0].filename : null;

    try {
      await sql.connect(dbConfig);

      // 1) Look up reporter in EMP
      const reporterResult = await sql.query`
        SELECT EmpID, EmpLocation, Dept, EmpName, EmpEmail
        FROM EMP
        WHERE EmpEmail = ${fullReporterEmail}
      `;

      if (reporterResult.recordset.length === 0) {
        return res
          .status(404)
          .json({ message: "Reporter not found in EMP table" });
      }

      const {
        EmpID: reporterEmpID,
        EmpLocation: empLocation,
        Dept: reporterDept,
        EmpName: reporterName,
        EmpEmail: reporterEmailFull,
      } = reporterResult.recordset[0];

      const reporterLocation = selectedLocation;

      // 2) Find the correct assignee for the ticket criteria
      const assigneeResult = await sql.query`
            SELECT Assignee_EmpID
            FROM Assignees
            WHERE EmpLocation = ${reporterLocation}
              AND Department = ${department}
              AND SubDept    = ${subDepartment}
              AND Subtask    = ${subTask}
              AND Task_Label = ${taskLabel}
          `;

      if (assigneeResult.recordset.length === 0) {
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
      const creationTimeStr = creationDate.toISOString().split("T")[1].split(".")[0];

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
      console.log("Creation Date:", creationDateStr);
      console.log("Incident Reported Date:", incidentReportedDate);
      console.log("Incident Reported Time:", incidentReportedTime);

      // If incidentReportedDate is blank, set it to the creation date
      const finalIncidentReportedDate =
        incidentReportedDate && incidentReportedDate.trim() !== ""
          ? incidentReportedDate
          : creationDate.toISOString().split("T")[0];

      // If incidentReportedTime is blank, set it to the creation time
      const finalIncidentReportedTime =
        incidentReportedTime && incidentReportedTime.trim() !== ""
          ? incidentReportedTime
          : creationTimeStr;

      console.log(
        "Final Incident Reported Date:",
        finalIncidentReportedDate
      );
      console.log(
        "Final Incident Reported Time:",
        finalIncidentReportedTime
      );

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
        Incident_Reported_Date, -- Ensure this matches the database column name
        Incident_Reported_Time, -- Ensure this matches the database column name
        Attachment,
        Expected_Completion_Date,
        TStatus,
        Assignee_SubDept
      )
      VALUES (
        ${ticketNumber},           -- 1
        GETDATE(),                 -- 2
        'Issue',                   -- 3
        ${title},                  -- 4
        ${description},            -- 5
        ${priority},               -- 6
        ${assigneeDept},           -- 7
        ${subTask},                -- 8
        ${taskLabel},              -- 9
        ${assigneeEmpID},          -- 10
        ${reporterLocation},       -- 11
        ${reporterDept},           -- 12
        ${reporterEmpID},          -- 13
        ${reporterName},           -- 14
        ${reporterEmailFull},      -- 15
        ${finalIncidentReportedDate}, -- 16
        ${finalIncidentReportedTime}, -- 17
        ${req.files?.[0]?.filename || null}, -- 18
        NULL,                      -- 19 Expected_Completion_Date
        'In-Progress',             -- 20 TStatus
        ${assigneeSubDept}         -- 21
      )
    `;
      console.log("Ticket inserted into Tickets table successfully.");

      // Send confirmation email to reporter
      const reporterSubject =
        "Premier Energies Ticketing Tool – Ticket Created Successfully";
      const reporterContent = `
        <p>Your ticket has been created successfully with Ticket Number: <strong>${ticketNumber}</strong>.</p>
        <p><strong>Ticket Details:</strong></p>
        <ul>
          <li><strong>Title:</strong> ${title}</li>
          <li><strong>Description:</strong> ${description}</li>
          <li><strong>Priority:</strong> ${priority}</li>
          <li><strong>Department:</strong> ${department}</li>
          <li><strong>Sub‑Department:</strong> ${subDepartment}</li>
          <li><strong>Category:</strong> ${subTask}</li>
          <li><strong>Sub-category:</strong> ${taskLabel}</li>
          <li><strong>Incident Reported Date:</strong> ${finalIncidentReportedDate}</li>
          <li><strong>Incident Reported Time:</strong> ${finalIncidentReportedTime}</li>
          ${
            req.files && req.files.length > 0
              ? `<li><strong>Attachments:</strong> ${req.files
                  .map((f) => f.originalname)
                  .join(", ")}</li>`
              : ""
          }
        </ul>
        <p>Thanks &amp; Regards,<br/>Team SPOT</p>
      `;
      // pass along any uploaded files so they're included as attachments
      await sendEmail(
        fullReporterEmail,
        reporterSubject,
        reporterContent,
        req.files
      );
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
      const assigneeSubject = `New Incident Assigned to You - ${title}`;
      const assigneeContent = `<p>A new incident has been assigned to you with Ticket Number: ${ticketNumber}</p>
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
        .json({ message: "Incident created and emails sent successfully" });
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

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

    // Step 3: Validate expected completion date
    if (
      req.body.Expected_Completion_Date &&
      (new Date(req.body.Expected_Completion_Date) <
        new Date(originalTicket.Incident_Reported_Date) ||
        (originalTicket.IT_Incident_Date &&
          new Date(req.body.Expected_Completion_Date) <
            new Date(originalTicket.IT_Incident_Date)))
    ) {
      return res.status(400).json({
        message:
          "Expected completion date cannot be prior to Incident Date or IT Incident Date",
      });
    }

    // Step 4: Update ticket details
    await updateTicketDetails(req.body);

    // Step 5: Generate history changes
    const changes = generateHistoryChanges(
      originalTicket,
      req.body,
      req.body.UserID,
      req.body.Comment
    );

    // Step 6: Insert history records
    await insertHistoryRecords(changes);

    // Step 7: Send emails if status or expected completion date changed, or if assignee updated
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

app.use("/uploads", express.static("uploads"));

const autoCloseTickets = async () => {
  try {
    await sql.connect(dbConfig);

    // 1) Find all tickets still marked Resolved
    const resolvedTicketsResult = await sql.query`
      SELECT Ticket_Number
      FROM Tickets
      WHERE TStatus = 'Resolved'
    `;
    const resolvedTickets = resolvedTicketsResult.recordset;

    const now = new Date();
    let closedCount = 0;

    for (const ticket of resolvedTickets) {
      // 2) Find when it was marked Resolved
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

        // 3) If it's been ≥ 7 days, close it
        if (diffDays >= 5) {
          // a) Update the ticket status
          await sql.query`
            UPDATE Tickets
            SET TStatus = 'Closed'
            WHERE Ticket_Number = ${ticket.Ticket_Number}
          `;

          // b) Insert a history record for the auto‑close
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
            )
            VALUES (
              ${ticket.Ticket_Number},  -- same ticket
              'SYSTEM',                 -- SYSTEM‑initiated
              'Auto-closed after 7 days of resolution',
              'Status',
              'Resolved',
              'Closed',
              GETDATE(),
              0
            )
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

app.post("/api/acknowledge-ticket", async (req, res) => {
  const { ticketNumber, userID, comment } = req.body;
  try {
    // 1) update the flag and timestamp in one go on the DB
    await req.db.request().input("tn", sql.NVarChar(50), ticketNumber).query(`
        UPDATE Tickets
        SET IT_Ack_Flag = 1,
            IT_Ack_Timestamp = GETDATE()
        WHERE Ticket_Number = @tn;
      `);

    // 2) capture that new timestamp for the client
    const result = await req.db
      .request()
      .input("tn", sql.NVarChar(50), ticketNumber).query(`
        SELECT IT_Ack_Timestamp AS ts
        FROM Tickets
        WHERE Ticket_Number = @tn;
      `);

    const ts = result.recordset[0].ts;
    // 3) optional: insert a history record
    await req.db
      .request()
      .input("tn", sql.NVarChar(50), ticketNumber)
      .input("uid", sql.NVarChar(255), userID)
      .input("cmt", sql.NVarChar(255), comment || "IT Acknowledged").query(`
        INSERT INTO History
          (HTicket_Number, UserID, Comment, Action_Type, Before_State, After_State, Timestamp, IsRead)
        VALUES
          (@tn, @uid, @cmt, 'IT Acknowledged', NULL, NULL, GETDATE(), 0)
      `);

    res.json({ itAckTimestamp: ts });
  } catch (err) {
    console.error("❌ /api/acknowledge-ticket error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// right after your existing mappings‐CRUD:
app.get("/api/assignees", async (req, res) => {
  try {
    const { recordset } = await req.db.request().query(`
      SELECT 
        MappingID,
        EmpLocation,
        Department,
        SubDept,
        SubTask,
        Task_Label,
        Ticket_Type,
        Assignee_EmpID
      FROM Assignees
      ORDER BY MappingID
    `);
    res.json(recordset);
  } catch (err) {
    console.error("Error fetching Assignees:", err);
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
      await sql.query`SELECT COUNT(*) as count FROM Assignees WHERE Assignee_EmpID = ${empID}`;
    const isAssignee = result.recordset[0].count > 0;
    res.status(200).json({ isAssignee });
  } catch (error) {
    console.error("Error checking assignee:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch a single ticket’s full details (including incident timestamps)
app.get("/api/ticket-details", async (req, res) => {
  const { ticketNumber } = req.query;
  if (!ticketNumber) {
    return res
      .status(400)
      .json({ message: "ticketNumber query parameter is required" });
  }

  try {
    await sql.connect(dbConfig);
    const result = await sql.query`
         SELECT
           -- all the columns you need from T *except* T.Reporter_Name & T.Reporter_Email:
           T.Ticket_Number,
           T.Creation_Date,
           T.Ticket_Type,
           T.Ticket_Title,
           T.Ticket_Description,
           T.Ticket_Priority,
           T.Assignee_Dept,
           T.Sub_Task,
           T.Task_Label,
           T.Assignee_EmpID,
           T.Reporter_Location,
           T.Reporter_Department,
           T.Reporter_EmpID,
           T.Incident_Reported_Date,
           T.Incident_Reported_Time,
           T.Attachment,
           T.Expected_Completion_Date,
           T.TStatus,
           T.Assignee_SubDept,
           T.IT_Incident_Date,
           T.IT_Incident_Time,
           T.IT_Ack_Flag,
           T.IT_Ack_Timestamp,
           -- now bring in exactly one Reporter_Name & Reporter_Email
           E.EmpName   AS Reporter_Name,
           E.EmpEmail  AS Reporter_Email,
           A.EmpName   AS Assignee_Name
         FROM Tickets T
         LEFT JOIN EMP E ON T.Reporter_EmpID = E.EmpID
         LEFT JOIN EMP A ON T.Assignee_EmpID = A.EmpID
         WHERE T.Ticket_Number = ${ticketNumber}
       `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Error fetching ticket details:", error);
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
    IT_Incident_Date,
    IT_Incident_Time,
    IT_Ack_Flag,
    IT_Ack_Timestamp,
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
      Assignee_EmpID = ${Assignee_EmpID || null},
      IT_Incident_Date        = ${IT_Incident_Date || null},
      IT_Incident_Time        = ${IT_Incident_Time || null},
      IT_Ack_Flag             = ${IT_Ack_Flag || false},
      IT_Ack_Timestamp        = ${IT_Ack_Timestamp || null}
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
      Assignee_EmpID,
      Incident_Reported_Date,
      IT_Incident_Date
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

// near the other GET endpoints, e.g. after /api/subtasks
app.get("/api/locations", async (req, res) => {
  const { department } = req.query;
  try {
    // get all distinct locations for that department
    const result = await sql.query`
      SELECT DISTINCT EmpLocation 
      FROM EMP 
      WHERE Dept = ${department}
    `;
    const locations = result.recordset
      .map((r) => r.EmpLocation)
      .filter(Boolean);
    res.status(200).json(locations);
  } catch (err) {
    console.error("Error fetching locations:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// CRUD for Assignee Mappings
// Assumes your Assignee table has a primary key column MappingID INT IDENTITY(1,1)

app.get("/api/assignee-mappings", async (req, res) => {
  try {
    const result = await req.db.request().query(`
      SELECT 
        MappingID,
        EmpLocation,
        Department,
        SubDept,
        SubTask,
        Task_Label,
        Ticket_Type,
        Assignee_EmpID
      FROM Assignees
      ORDER BY MappingID
    `);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error fetching mappings:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/assignee-mappings", async (req, res) => {
  const {
    EmpLocation,
    Department,
    SubDept,
    SubTask,
    Task_Label,
    Ticket_Type,
    Assignee_EmpID,
  } = req.body;

  try {
    await req.db
      .request()
      .input("loc", sql.NVarChar(100), EmpLocation)
      .input("dept", sql.NVarChar(100), Department)
      .input("sd", sql.NVarChar(100), SubDept)
      .input("st", sql.NVarChar(100), SubTask)
      .input("tl", sql.NVarChar(100), Task_Label)
      .input("tt", sql.NVarChar(100), Ticket_Type)
      .input("ae", sql.NVarChar(50), Assignee_EmpID).query(`
        INSERT INTO Assignee
          (EmpLocation, Department, SubDept, SubTask, Task_Label, Ticket_Type, Assignee_EmpID)
        VALUES
          (@loc, @dept, @sd, @st, @tl, @tt, @ae)
      `);
    res.status(201).json({ message: "Mapping created" });
  } catch (err) {
    console.error("Error creating mapping:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/assignee-mappings/:id", async (req, res) => {
  const { id } = req.params;
  const {
    EmpLocation,
    Department,
    SubDept,
    SubTask,
    Task_Label,
    Ticket_Type,
    Assignee_EmpID,
  } = req.body;

  try {
    await req.db
      .request()
      .input("id", sql.Int, id)
      .input("loc", sql.NVarChar(100), EmpLocation)
      .input("dept", sql.NVarChar(100), Department)
      .input("sd", sql.NVarChar(100), SubDept)
      .input("st", sql.NVarChar(100), SubTask)
      .input("tl", sql.NVarChar(100), Task_Label)
      .input("tt", sql.NVarChar(100), Ticket_Type)
      .input("ae", sql.NVarChar(50), Assignee_EmpID).query(`
        UPDATE Assignee
        SET
          EmpLocation   = @loc,
          Department    = @dept,
          SubDept       = @sd,
          SubTask       = @st,
          Task_Label    = @tl,
          Ticket_Type   = @tt,
          Assignee_EmpID= @ae
        WHERE MappingID = @id
      `);
    res.status(200).json({ message: "Mapping updated" });
  } catch (err) {
    console.error("Error updating mapping:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/assignee-mappings/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await req.db
      .request()
      .input("id", sql.Int, id)
      .query(`DELETE FROM Assignees WHERE MappingID = @id`);
    res.status(200).json({ message: "Mapping deleted" });
  } catch (err) {
    console.error("Error deleting mapping:", err);
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

    // 2) Fetch the current ticket status
    const ticketRes = await sql.query`
      SELECT TStatus 
      FROM Tickets 
      WHERE Ticket_Number = ${ticketNumber}
    `;
    if (ticketRes.recordset.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    const currentStatus = ticketRes.recordset[0].TStatus;

    // 3) Determine new status
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

    // 4) Update ticket in DB
    const originalTicket = await getOriginalTicket(ticketNumber);
    await sql.query`
      UPDATE Tickets
      SET TStatus = ${newStatus}
      WHERE Ticket_Number = ${ticketNumber}
    `;

    // 5) Insert history record that clearly shows who closed it
    //    SYSTEM‑closes use UserID = 'SYSTEM', user‑closes use their userID
    const commentText =
      action === "accept"
        ? `Closed by user ${userID}`
        : "Resolution rejected. Ticket reopened";

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
        ${ticketNumber},
        ${userID},
        ${commentText},
        'Status',
        ${originalTicket.TStatus},
        ${newStatus},
        GETDATE(),
        0
      )
    `;

    // 6) Send the usual notifications
    await sendStatusChangeEmail(ticketNumber, [
      {
        HTicket_Number: ticketNumber,
        UserID: userID,
        Comment: commentText,
        Action_Type: "Status",
        Before_State: originalTicket.TStatus,
        After_State: newStatus,
      },
    ]);

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

// ── CRUD for Companies ──────────────────────────────────────────────────────

// GET all companies
app.get("/api/companies", async (req, res) => {
  try {
    const result = await req.db.request().query(`
      SELECT CompanyCode, CompanyShortName, CompanyName
      FROM dbo.Companies
      ORDER BY CompanyCode
    `);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error fetching companies:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET all locations
app.get("/api/spotLocations", async (req, res) => {
  try {
    const result = await req.db.request().query(`
      SELECT LocationID, CompanyCode, LocationName
      FROM dbo.Locations
    `);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error fetching locations:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE a new location
app.post("/api/spotLocations", async (req, res) => {
  const { CompanyCode, LocationName } = req.body;
  try {
    const result = await req.db
      .request()
      .input("cc", sql.Int, CompanyCode)
      .input("name", sql.NVarChar(255), LocationName)
      .query(`
        INSERT INTO dbo.Locations (CompanyCode, LocationName)
        OUTPUT inserted.LocationID, inserted.CompanyCode, inserted.LocationName
        VALUES (@cc, @name)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error("Error creating location:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE an existing location
app.put("/api/spotLocations/:id", async (req, res) => {
  const { id } = req.params;
  const { CompanyCode, LocationName } = req.body;
  try {
    const result = await req.db
      .request()
      .input("id", sql.Int, id)
      .input("cc", sql.Int, CompanyCode)
      .input("name", sql.NVarChar(255), LocationName)
      .query(`
        UPDATE dbo.Locations
        SET CompanyCode = @cc,
            LocationName = @name
        WHERE LocationID = @id;

        SELECT LocationID, CompanyCode, LocationName
        FROM dbo.Locations
        WHERE LocationID = @id;
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Location not found" });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error updating location:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE a location
app.delete("/api/spotLocations/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await req.db
      .request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM dbo.Locations
        WHERE LocationID = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Location not found" });
    }
    res.json({ message: "Location deleted" });
  } catch (err) {
    console.error("Error deleting location:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET one company by code
app.get("/api/companies/:code", async (req, res) => {
  const { code } = req.params;
  try {
    const result = await req.db.request().input("code", sql.Int, code).query(`
        SELECT CompanyCode, CompanyShortName, CompanyName
        FROM dbo.Companies
        WHERE CompanyCode = @code
      `);
    if (!result.recordset.length) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching company:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE a new company
app.post("/api/companies", async (req, res) => {
  const { CompanyCode, CompanyShortName, CompanyName } = req.body;
  try {
    await req.db
      .request()
      .input("code", sql.Int, CompanyCode)
      .input("short", sql.NVarChar(50), CompanyShortName)
      .input("name", sql.NVarChar(255), CompanyName).query(`
        INSERT INTO dbo.Companies (CompanyCode, CompanyShortName, CompanyName)
        VALUES (@code, @short, @name)
      `);
    res.status(201).json({ message: "Company created" });
  } catch (err) {
    console.error("Error creating company:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE an existing company
app.put("/api/companies/:code", async (req, res) => {
  const { code } = req.params;
  const { CompanyShortName, CompanyName } = req.body;
  try {
    const result = await req.db
      .request()
      .input("code", sql.Int, code)
      .input("short", sql.NVarChar(50), CompanyShortName)
      .input("name", sql.NVarChar(255), CompanyName).query(`
        UPDATE dbo.Companies
        SET CompanyShortName = @short,
            CompanyName      = @name
        WHERE CompanyCode = @code
      `);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json({ message: "Company updated" });
  } catch (err) {
    console.error("Error updating company:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE a company
app.delete("/api/companies/:code", async (req, res) => {
  const { code } = req.params;
  try {
    const result = await req.db.request().input("code", sql.Int, code).query(`
        DELETE FROM dbo.Companies
        WHERE CompanyCode = @code
      `);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json({ message: "Company deleted" });
  } catch (err) {
    console.error("Error deleting company:", err);
    // probably a FK violation if there are Locations pointing here
    if (err.number === 547) {
      return res
        .status(400)
        .json({ message: "Cannot delete ‑ locations exist for this company" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// ── New endpoint: return all IT‐department employees for the org chart ──
app.get("/api/it-org-chart", async (req, res) => {
  try {
    const result = await req.db.request().query(`
      SELECT EmpID, EmpName
      FROM EMP
      WHERE Dept = 'IT'
      ORDER BY EmpName
    `);
    // wrap them in a root node so Recharts Treemap can use `children`
    res.json([
      {
        name: "IT Department",
        children: result.recordset.map((e) => ({
          name: e.EmpName,
          size: 1,
          EmpID: e.EmpID,
        })),
      },
    ]);
  } catch (err) {
    console.error("Error fetching IT org chart:", err);
    res.status(500).json({ message: "Server error" });
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
    const result = await req.db
      .request()
      .input("tn", sql.NVarChar(50), ticketNumber).query(`
        SELECT
          H.HTicket_Number,
          H.Action_Type,
          H.Before_State,
          H.After_State,
          H.Comment,
          H.Timestamp,
          H.UserID,
          COALESCE(E.EmpName, H.UserID) AS CommittedBy
        FROM History H
        LEFT JOIN EMP E
          ON H.UserID = E.EmpEmail
        WHERE H.HTicket_Number = @tn
        ORDER BY H.Timestamp DESC
      `);

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

app.get("/api/search-employees", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);

  try {
    console.log("🔍 search‑employees q=", q);

    const request = req.db.request();
    // give NVARCHAR a length
    request.input("q", sql.NVarChar(100), `${q}%`);

    const result = await request.query(`
      SELECT DISTINCT
        LEFT(EmpEmail, CHARINDEX('@', EmpEmail) - 1) AS username
      FROM EMP
      WHERE EmpEmail LIKE @q + '@%'
        AND CHARINDEX('@', EmpEmail) > 1
        AND ActiveFlag = 1
      ORDER BY username
    `);

    const suggestions = result.recordset.map((r) => r.username).slice(0, 10);

    return res.json(suggestions);
  } catch (err) {
    console.error("❌ /api/search-employees failed:", err);
    return res.status(500).json({ message: "Server error" });
  }
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
const PORT = process.env.PORT || 443;
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

(async function start() {
  await initializeDatabase();
  const HOST = process.env.HOST || "0.0.0.0";
  const HTTPS_PORT = process.env.HTTPS_PORT || 11443;
  const HTTP_PORT = process.env.HTTP_PORT || 8080;

  // HTTPS server (unchanged)
  https.createServer(httpsOptions, app).listen(HTTPS_PORT, HOST, () => {
    console.log(`HTTPS Server running at https://${HOST}:${HTTPS_PORT}`);
  });

  // HTTP server (new)
  http.createServer(app).listen(HTTP_PORT, HOST, () => {
    console.log(` HTTP Server running at http://${HOST}:${HTTP_PORT}`);
  });
})();
