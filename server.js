const express = require("express");
const cors = require("cors");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" }); // Directory for file uploads

app.use(express.json());

const File_path = "./uploads/data.csv"; // The path to your CSV file

//file upload
app.post("/api/upload", upload.single("file"), (req, res) => {
  //   console.log(req.file.path, 444);
  const tempPath = req.file.path;

  const dataToSave = [];
  fs.createReadStream(tempPath)
    .pipe(csv())
    .on("data", (row) => {
      dataToSave.push(row);
      const csvData = dataToSave.map((row) =>
        Object.values(row)
          .map((value) => `"${value}"`)
          .join(",")
      );

      // CSV header (column names)
      const header = Object.keys(dataToSave[0]).join(",");

      // Combine header and data rows
      const csvContent = [header, ...csvData].join("\n");

      fs.writeFile(File_path, csvContent, (err) => {
        if (err) {
          console.error("Error writing to the CSV file:", err);
          return;
        }
        console.log("Data has been successfully saved to the CSV file.");
      });
    })
    .on("end", () => {
      fs.unlinkSync(tempPath);
      res.json({ message: "File uploaded and data saved." });
    });
});

//Read File
app.get("/api/read", (req, res) => {
  const data = []; // Store data from the CSV file

  fs.createReadStream(File_path)
    .pipe(csv())
    .on("data", (row) => {
      data.push(row);
    })
    .on("end", () => {
      res.json(data);
    });
});

//create New
app.post("/api/create", (req, res) => {
  const newData = req.body; // Assuming newData is an object containing the data for the new record

  // Read the existing data from the CSV file
  const data = [];

  fs.createReadStream(File_path)
    .pipe(csv())
    .on("data", (row) => {
      data.push(row);
    })
    .on("end", () => {
      // Add the new record to the data array
      data.push(newData);

      // Convert the data to a CSV-formatted string
      const csvData = data.map((row) => Object.values(row).join(","));

      const header = Object.keys(data[0]).join(",");

      // Combine header and data rows
      const csvContent = [header, ...csvData].join("\n");

      // Write the updated data, including the new record, back to the CSV file
      fs.writeFile(File_path, csvContent, (err) => {
        if (err) {
          console.error("Error creating a new record:", err);
          res.status(500).json({ error: "Failed to create a new record" });
          return;
        }
        res.json({ message: "New record created successfully" });
      });
    });
});

// Update by EmployeeID
app.put("/api/update/:id", (req, res) => {
  const EmployeeID = req.params.id;
  const updatedData = req.body; // Updated data for the record

  // Read the existing data from the CSV file
  const data = [];

  fs.createReadStream(File_path)
    .pipe(csv())
    .on("data", (row) => {
      data.push(row);
    })
    .on("end", () => {
      const index = data.findIndex((item) => item.EmployeeID === EmployeeID);

      if (index === -1) {
        res.status(404).json({ error: "Record not found" });
        return;
      }

      data[index] = updatedData;

      // Convert the data to a CSV-formatted string
      const csvData = data.map((row) => Object.values(row).join(","));
      // .join("\n");

      const header = Object.keys(data[0]).join(",");

      // Combine header and data rows
      const csvContent = [header, ...csvData].join("\n");

      // Write the updated data back to the CSV file
      fs.writeFile(File_path, csvContent, (err) => {
        if (err) {
          console.error("Error updating the record:", err);
          res.status(500).json({ error: "Failed to update the record" });
          return;
        }
        res.json({ message: "Record updated successfully" });
      });
    });
});

// Delete by EmployeeID
app.delete("/api/delete/:id", (req, res) => {
  const EmployeeID = req.params.id;

  // Read the existing data from the CSV file
  let data = [];

  fs.createReadStream(File_path)
    .pipe(csv())
    .on("data", (row) => {
      data.push(row);
    })
    .on("end", () => {
      const index = data.findIndex((item) => item.EmployeeID === EmployeeID);

      if (index === -1) {
        res.status(404).json({ error: "Record not found" });
        return;
      }

      // // Remove the record from the data
      data.splice(index, 1);

      // Convert the data to a CSV-formatted string
      const csvData = data.map((row) => Object.values(row).join(","));

      const header = Object.keys(data[0]).join(",");

      // Combine header and data rows
      const csvContent = [header, ...csvData].join("\n");

      // Write the updated data back to the CSV file
      fs.writeFile(File_path, csvContent, (err) => {
        if (err) {
          console.error("Error deleting the record:", err);
          res.status(500).json({ error: "Failed to delete the record" });
          return;
        }
        res.json({ message: "Record deleted successfully" });
      });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
