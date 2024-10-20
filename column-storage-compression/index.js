const fs = require("fs");
const { faker } = require("@faker-js/faker");
const readline = require("readline");
const duckdb = require("duckdb");
const zlib = require("zlib");

// Parse command line arguments
const numberOfRecords = parseInt(process.argv[2]);

if (isNaN(numberOfRecords) || numberOfRecords <= 0) {
  console.error(
    "Error: Please provide a valid positive number of records as a command line argument."
  );
  console.error("Usage: node index.js <number_of_records>");
  console.error("Example: node index.js 1000000");
  process.exit(1);
}

const outputFileNDJSON = "http_logs.ndjson";
const outputFileNDJSONGzipped = "http_logs.ndjson.gz";
const outputFileCSV = "http_logs.csv";
const outputFileParquet = "http_logs.parquet";
const outputFileDuckDB = "http_logs.duckdb";

// Function to delete existing files
function deleteExistingFiles() {
  const files = [
    outputFileNDJSON,
    outputFileNDJSONGzipped,
    outputFileCSV,
    outputFileParquet,
    outputFileDuckDB,
  ];

  files.forEach((file) => {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        console.log(`Deleted existing file: ${file}`);
      } catch (err) {
        console.error(`Error deleting file ${file}: ${err.message}`);
      }
    }
  });
}

// Delete existing files before starting
deleteExistingFiles();

const generateDynamicPaths = () => {
  const paths = [
    { path: `/api/users/${faker.string.uuid()}`, route: "/api/users/:uuid" },
    {
      path: `/api/products/${faker.string.uuid()}`,
      route: "/api/products/:uuid",
    },
    {
      path: `/api/orders/${faker.number.int({ min: 10000, max: 99999 })}`,
      route: "/api/orders/:id",
    },
    {
      path: `/api/articles/${faker.lorem.slug(3)}`,
      route: "/api/articles/:slug",
    },
    {
      path: `/api/categories/${faker.lorem.slug(2)}`,
      route: "/api/categories/:slug",
    },
  ];
  return paths;
};

const generateInstanceList = () => {
  return ["api-1", "api-2", "api-3", "api-4", "api-5"];
};

const generateHttpLog = () => {
  const staticPaths = [
    { path: "/api/users", route: "/api/users" },
    { path: "/api/products", route: "/api/products" },
    { path: "/api/orders", route: "/api/orders" },
    { path: "/api/auth", route: "/api/auth" },
    { path: "/api/settings", route: "/api/settings" },
  ];

  const pathData = faker.helpers.arrayElement([
    ...staticPaths,
    ...generateDynamicPaths(),
  ]);

  return {
    timestamp: faker.date.recent().toISOString(),
    duration_ms: faker.number.float({ min: 0.1, max: 2000, precision: 0.1 }),
    main: true,
    "http.ip_address": faker.internet.ipv4(),
    "instance.id": faker.helpers.arrayElement(generateInstanceList()),
    "instance.memory_mb": 12336,
    "instance.cpu_count": 4,
    "instance.type": "t3.small",
    "http.request.method": faker.helpers.arrayElement([
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
    ]),
    "http.request.path": pathData.path,
    "http.route": pathData.route,
    "http.request.body.size": faker.number.int({ min: 0, max: 1000000 }),
    "http.request.header.content_type": faker.helpers.arrayElement([
      "application/json",
      "text/html",
      "application/xml",
      "text/plain",
    ]),
    "user_agent.original": faker.internet.userAgent(),
    "user_agent.device": faker.helpers.arrayElement([
      "phone",
      "tablet",
      "computer",
    ]),
    "user_agent.os": faker.helpers.arrayElement([
      "iOS",
      "Android",
      "Windows",
      "macOS",
    ]),
    "user_agent.browser": faker.helpers.arrayElement([
      "Chrome",
      "Firefox",
      "Safari",
      "Edge",
    ]),
    "user_agent.browser_version": faker.helpers.arrayElement([
      "1.0",
      "2.0",
      "3.0",
      "4.0",
    ]),
    "url.scheme": "https",
    "url.host": "api-service.com",
    "service.name": "api-service",
    "service.version": "1.0.0",
    "build.id": "1234567890",
    "go.version": "go1.23.2",
    "rails.version": "7.2.1.1",
    "service.environment": "production",
    "service.team": "api-team",
    "service.slack_channel": "#api-alerts",
    "service.build.deployment.at": "2024-10-14T19:47:38Z",
    "service.build.diff_url":
      "https://github.com/your-company/api-service/compare/c9d9380..05e5736",
    "service.build.pull_request_url":
      "https://github.com/your-company/api-service/pull/123",
    "service.build.git_hash": "05e5736",
    "service.build.deployment.user": "keanu.reeves@your-company.com",
    "service.build.deployment.trigger": "manual",
    "container.id": "1234567890",
    "container.name": "api-service-1234567890",
    "cloud.availability_zone": "us-east-1",
    "cloud.region": "us-east-1",
    "k8s.pod.name": "api-service-1234567890",
    "k8s.cluster.name": "api-service-cluster",
    "feature_flag.auth_v2": faker.datatype.boolean(),
    "http.response.status_code": faker.helpers.arrayElement([
      200, 201, 204, 400, 401, 403, 404, 500,
    ]),
    "user.id": faker.internet.email(),
    "user.type": faker.helpers.arrayElement([
      "free",
      "premium",
      "enterprise",
      "vip",
    ]),
    "user.auth_method": faker.helpers.arrayElement([
      "token",
      "basic-auth",
      "jwt",
      "sso-github",
      "sso-google",
    ]),
    "user.team_id": faker.helpers.arrayElement([
      "team-1",
      "team-2",
      "team-3",
      "team-4",
      "team-5",
    ]),
  };
};

const writeStream = fs.createWriteStream(outputFileNDJSON);

console.log(`Generating ${numberOfRecords} HTTP log entries...`);

for (let i = 0; i < numberOfRecords; i++) {
  const log = generateHttpLog();
  writeStream.write(JSON.stringify(log) + "\n");

  if (i % 100000 === 0) {
    console.log(`Generated ${i} log entries...`);
  }
}

writeStream.end();

writeStream.on("finish", () => {
  console.log(
    `Finished generating ${numberOfRecords} log entries in ${outputFileNDJSON}`
  );
  gzipNDJSON();
});

function gzipNDJSON() {
  console.log("Compressing NDJSON file with gzip...");
  const readStream = fs.createReadStream(outputFileNDJSON);
  const writeStream = fs.createWriteStream(outputFileNDJSONGzipped);
  const gzip = zlib.createGzip();

  readStream
    .pipe(gzip)
    .pipe(writeStream)
    .on("finish", () => {
      console.log(
        `Finished compressing NDJSON. Output file: ${outputFileNDJSONGzipped}`
      );
      convertToCSVParquetAndDuckDB();
    });
}

function convertToCSVParquetAndDuckDB() {
  console.log("Converting NDJSON to CSV, Parquet, and DuckDB...");

  const db = new duckdb.Database(outputFileDuckDB);

  db.all(
    `
    INSTALL parquet;
    LOAD parquet;
    CREATE TABLE http_logs AS SELECT * FROM read_json_auto('${outputFileNDJSON}');
    COPY http_logs TO '${outputFileCSV}' (FORMAT CSV, HEADER);
    COPY http_logs TO '${outputFileParquet}' (FORMAT PARQUET);
  `,
    (err) => {
      if (err) {
        console.error("Error converting to CSV, Parquet, and DuckDB:", err);
      } else {
        console.log(
          `Finished converting to CSV. Output file: ${outputFileCSV}`
        );
        console.log(
          `Finished converting to Parquet. Output file: ${outputFileParquet}`
        );
        console.log(
          `Finished creating DuckDB database. Output file: ${outputFileDuckDB}`
        );
      }
      db.close(() => {
        console.log("DuckDB connection closed.");
        printFileSizes();
      });
    }
  );
}

function printFileSizes() {
  const files = [
    outputFileNDJSON,
    outputFileCSV,
    outputFileNDJSONGzipped,
    outputFileParquet,
    outputFileDuckDB,
  ];

  console.log("\nGenerated files and their sizes:");
  console.log("--------------------------------");

  const maxFileNameLength = Math.max(...files.map((file) => file.length));

  files.forEach((file) => {
    try {
      const stats = fs.statSync(file);
      const fileSizeInBytes = stats.size;
      const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
      const sizeString = `${fileSizeInMegabytes.toFixed(2)} MB`;
      console.log(
        `${file.padEnd(maxFileNameLength + 2)}${sizeString.padStart(10)}`
      );
    } catch (err) {
      console.error(`Error getting file size for ${file}: ${err.message}`);
    }
  });
}
