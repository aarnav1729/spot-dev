const sql = require("mssql");
const xlsx = require("xlsx");

// Database connection configuration
const dbConfig = {
  user: "aarnav",
  password: "City@3801",
  server: "10.0.40.10",
  port: 1433,
  database: "SPOT",
  options: {
    trustServerCertificate: true,
    encrypt: false,
    connectionTimeout: 60000,
  },
};


// Read data from Excel file
const excelFilePath = "n.xlsx"; // Replace with your Excel file path
const workbook = xlsx.readFile(excelFilePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]]; // Read the first sheet
const data = xlsx.utils.sheet_to_json(worksheet);

(async function () {
  try {
    // Connect to MSSQL database
    const pool = await sql.connect(dbConfig);

    // Iterate through the Excel data and insert into the database
    for (const row of data) {
      const { SubDept, TPrefix } = row; // Assuming these are column names in the Excel file

      // Insert query
      const query = `INSERT INTO TNumber (TSubDept, TPrefix) VALUES (@TSubDept, @TPrefix)`; // Replace 'YourTableName' with your table name

      // Execute query
      await pool
        .request()
        .input("TSubDept", sql.NVarChar, SubDept) // Replace sql.NVarChar with the appropriate datatype
        .input("TPrefix", sql.NVarChar, TPrefix) // Replace sql.NVarChar with the appropriate datatype
        .query(query);
    }

    console.log("Data inserted successfully");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    // Close the database connection
    await sql.close();
  }
})();
