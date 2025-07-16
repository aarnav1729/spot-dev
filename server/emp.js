const sql = require('mssql');
const xlsx = require('xlsx');

// 1. Configure your SQL Server connection details
const config = {
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

async function main() {
  let pool;
  let transaction;

  try {
    // 2. Read the EMP.xlsx file
    const workbook = xlsx.readFile('EMP.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

    // 3. Connect to the database
    pool = await sql.connect(config);

    // 4. Begin a transaction (for atomic inserts)
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    console.log("Transaction started...");

    // 5. Insert each row from the Excel file into EMP
    for (const row of rows) {
      const request = new sql.Request(transaction);

      // Convert ManagerID to a string or null
      const managerIdValue = row.ManagerID ? String(row.ManagerID) : null;

      // Optional: remove any unpaired surrogate or invalid Unicode chars
      // managerIdValue = managerIdValue?.replace(/[^\u0000-\uFFFF]/g, '');

      await request
        .input('EmpID',       sql.NVarChar(50), row.EmpID)
        .input('EmpEmail',    sql.NVarChar(100), row.EmpEmail)
        .input('EmpName',     sql.NVarChar(100), row.EmpName)
        .input('Dept',        sql.NVarChar(100), row.Dept)
        .input('SubDept',     sql.NVarChar(100), row.SubDept)
        .input('EmpLocation', sql.NVarChar(100), row.EmpLocation)
        .input('Designation', sql.NVarChar(100), row.Designation)
        .input('ActiveFlag',  sql.Int, row.ActiveFlag)
        .input('ManagerID',   sql.NVarChar(50), managerIdValue)
        .query(`
          INSERT INTO [EMP]
            (EmpID, EmpEmail, EmpName, Dept, SubDept, EmpLocation, Designation, ActiveFlag, ManagerID)
          VALUES
            (@EmpID, @EmpEmail, @EmpName, @Dept, @SubDept, @EmpLocation, @Designation, @ActiveFlag, @ManagerID)
        `);
    }

    // 6. Commit the transaction
    await transaction.commit();
    console.log("All rows inserted successfully. Transaction committed.");
  } catch (err) {
    console.error("Error:", err);

    // Rollback if any insert fails
    if (transaction && transaction._acquiredConnection) {
      try {
        await transaction.rollback();
        console.log("Transaction rolled back due to error.");
      } catch (rollbackErr) {
        console.error("Rollback error:", rollbackErr);
      }
    }
  } finally {
    // 7. Close the connection
    if (pool && pool.connected) {
      await pool.close();
      console.log("Database connection closed.");
    }
  }
}

// Run the script
main();
