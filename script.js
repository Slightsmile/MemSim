// script.js

document.addEventListener("DOMContentLoaded", () => {
  const page =
    location.pathname.split("/").pop().replace(".html", "") || "index";

  switch (page) {
    case "index":
      initLanding();
      break;

    case "first-fit":
      initFirstFit();
      break;

    case "best-fit":
      initBestFit();
      break;

    case "next-fit":
      initNextFit();
      break;

    case "worst-fit":
      initWorstFit();
      break;

    case "paging":
      initPaging();
      break;

    case "segmentation":
      initSegmentation();
      break;

    case "info": // No JS needed on info page
      break;

    default: // unknown page
      break;
  }
});

// ==== Helpers ====

function parseSizes(text) {
  return text
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n) && n > 0);
}

// Helper to parse named segments (e.g., 'Stack:100,Code:250')
function parseNamedSegments(text) {
  const segments = {};
  text.split(",").forEach((s) => {
    const parts = s.split(":").map((p) => p.trim());
    if (parts.length === 2 && !isNaN(parseInt(parts[1]))) {
      segments[parts[0]] = parseInt(parts[1]);
    }
  });
  return segments;
}

function createMemBlock(label, size, allocated, animDelay = 0) {
  const div = document.createElement("div");
  div.className = "mem-block" + (allocated ? " allocated" : "");
  div.style.width = Math.max(40, size) + "px";
  div.style.animation = `fadeIn 0.5s ease forwards`;
  div.style.animationDelay = animDelay + "s";

  const memLabel = document.createElement("div");
  memLabel.className = "mem-label";
  memLabel.textContent = label;
  div.appendChild(memLabel);

  div.appendChild(document.createTextNode(size + " KB"));
  return div;
}

// Generates an array of random sizes
function generateRandomSizes(count, min, max) {
  const sizes = [];
  for (let i = 0; i < count; i++) {
    sizes.push(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return sizes.join(", ");
}

// Animate allocation block color change - Changed color to match Windows 98 blue
function animateAllocationBlock(block, color = "#000080", duration = 800) {
  block.style.transition = `background-color ${duration}ms ease`;
  block.style.backgroundColor = color;
  block.style.color = "white";
  setTimeout(() => {
    block.style.backgroundColor = "";
    block.style.color = "";
  }, duration);
}

// Creates a table and appends it to a target element
function createTable(headers, data, targetElement) {
  const table = document.createElement("table");
  table.className = "results-table";
  const thead = table.createTHead();
  const tbody = table.createTBody(); // Create table headers

  let headerRow = thead.insertRow();
  headers.forEach((headerText) => {
    let th = document.createElement("th");
    th.textContent = headerText;
    headerRow.appendChild(th);
  }); // Create table body rows

  data.forEach((rowData) => {
    let row = tbody.insertRow();
    rowData.forEach((cellData) => {
      let cell = row.insertCell();
      cell.textContent = cellData;
    });
  });

  targetElement.appendChild(table);
}

// FadeIn animation keyframes and other styles added via JS on load
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes fadeIn {
    0% {opacity: 0; transform: translateY(15px);}
    100% {opacity: 1; transform: translateY(0);}
  }
  
  /* Windows 98 Theme Styles */
  body {
    background-color: #008080; /* Teal background */
    font-family: 'MS Sans Serif', 'Arial', sans-serif;
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100vh;
  }
  .container {
    width: 100%;
    margin: 0;
    padding: 20px;
    background-color: #c0c0c0; /* Gray window background */
    border: none;
    box-shadow: none;
    height: 100vh;
    overflow-y: auto;
  }
  h3 {
    display: none;
  }
  .input-area {
    margin-bottom: 20px;
  }
  .input-area label, .status {
    color: #000;
    font-weight: bold;
  }
  .input-area input[type="text"], .input-area input[type="number"] {
    background-color: #fff;
    border: 1px solid #808080;
    border-right-color: #fff;
    border-bottom-color: #fff;
    padding: 2px 4px;
    font-family: 'MS Sans Serif', 'Arial', sans-serif;
    width: 300px;
    margin-bottom: 10px;
  }
  .input-area button {
    background-color: #c0c0c0;
    border: 2px solid;
    border-color: #fff #808080 #808080 #fff;
    padding: 5px 15px;
    font-family: 'MS Sans Serif', 'Arial', sans-serif;
    font-weight: bold;
    cursor: pointer;
    margin: 5px;
    box-shadow: 1px 1px 0 #000;
  }
  .input-area button:active {
    border-color: #808080 #fff #fff #808080;
  }

  /* Table styles */
  .results-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    border: 2px solid #fff;
    border-right-color: #808080;
    border-bottom-color: #808080;
  }
  .results-table th, .results-table td {
    border: 1px solid #c0c0c0;
    padding: 5px;
    text-align: left;
    font-family: 'MS Sans Serif', 'Arial', sans-serif;
  }
  .results-table th {
    background-color: #c0c0c0;
    border: 2px solid;
    border-color: #fff #808080 #808080 #fff;
    font-weight: bold;
    text-transform: uppercase;
    color: #000;
    padding: 5px 10px;
  }
  .results-table td {
    background-color: #fff;
  }
  .results-table tr:nth-child(even) td {
    background-color: #f0f0f0;
  }
  .results-table tr:hover td {
    background-color: #e0e0e0;
  }
  .mem-block {
    background-color: #e0e0e0;
    border: 2px solid #808080;
    border-right-color: #fff;
    border-bottom-color: #fff;
  }
  .mem-block.allocated {
    background-color: #000080;
    color: white;
  }
`;
document.head.appendChild(styleSheet);

// ==== Landing Page (index.html) ====
function initLanding() {
  const inputArea = document.getElementById("input-area");
  const vis = document.getElementById("visualization");
  const status = document.getElementById("status");
  if (inputArea)
    inputArea.innerHTML = `<p>Select an algorithm from the menu to start.</p>`;
  if (vis) vis.innerHTML = "";
  if (status) status.textContent = "";
}

// ==== First Fit ====

function initFirstFit() {
  setupInputArea("first-fit");

  document.getElementById("start-btn").onclick = async () => {
    await simulateFirstFit();
  };
  document.getElementById("random-btn").onclick = populateRandomValuesFirstFit;
}

function populateRandomValuesFirstFit() {
  document.getElementById("memory-blocks").value = generateRandomSizes(
    5,
    100,
    1000
  );
  document.getElementById("processes").value = generateRandomSizes(5, 50, 500);
}

function setupInputArea(pageType) {
  const inputArea = document.getElementById("input-area");
  const visualization = document.getElementById("visualization");
  const status = document.getElementById("status");
  if (!inputArea || !visualization || !status) return;

  let inputsHtml = "";
  let title = "";

  if (pageType === "paging") {
    title = "Paging Simulation";
    inputsHtml = `
      <label>Total Memory Size (KB):</label><br/>
      <input id="total-memory" type="number" placeholder="e.g. 1024" /><br/>
      <label>Page Size (KB):</label><br/>
      <input id="page-size" type="number" placeholder="e.g. 128" /><br/>
      <label>Processes (comma separated sizes):</label><br/>
      <input id="processes" type="text" placeholder="200, 450, 100, 300" /><br/>
    `;
  } else if (pageType === "segmentation") {
    title = "Segmentation Allocation";
    inputsHtml = `
      <label>Memory Segments (comma separated sizes):</label><br/>
      <input id="memory-segments" type="text" placeholder="100, 500, 200, 300, 600" /><br/>
      <label>Process Segments (Name:Size, comma separated):</label><br/>
      <input id="process-segments" type="text" placeholder="Stack:212, Code:417, Data:112, Heap:426" /><br/>
    `;
  } else {
    // For First Fit, Best Fit, Next Fit, Worst Fit
    switch (pageType) {
      case "first-fit":
        title = "First Fit Allocation";
        break;
      case "best-fit":
        title = "Best Fit Allocation";
        break;
      case "next-fit":
        title = "Next Fit Allocation";
        break;
      case "worst-fit":
        title = "Worst Fit Allocation";
        break;
    }
    inputsHtml = `
      <label>Memory Blocks (comma separated sizes):</label><br/>
      <input id="memory-blocks" type="text" placeholder="100, 500, 200, 300, 600" /><br/>
      <label>Processes (comma separated sizes):</label><br/>
      <input id="processes" type="text" placeholder="212, 417, 112, 426" /><br/>
    `;
  }

  inputArea.innerHTML = `
    <h3>${title}</h3>
    ${inputsHtml}
    <button id="start-btn">Start Allocation</button>
    <button id="random-btn">Random Values</button>
  `;

  visualization.innerHTML = "";
  status.textContent = "";
}

async function simulateFirstFit() {
  const memInput = document.getElementById("memory-blocks").value;
  const procInput = document.getElementById("processes").value;
  const visualization = document.getElementById("visualization");
  const status = document.getElementById("status");

  let resultsContainer = document.getElementById("results-container");
  if (!resultsContainer) {
    resultsContainer = document.createElement("div");
    resultsContainer.id = "results-container";
    visualization.parentNode.insertBefore(
      resultsContainer,
      visualization.nextSibling
    );
  }
  resultsContainer.innerHTML = "";

  const memoryBlocks = parseSizes(memInput);
  const processes = parseSizes(procInput);

  if (memoryBlocks.length === 0 || processes.length === 0) {
    status.textContent = "Please enter valid memory blocks and processes.";
    return;
  }

  visualization.innerHTML = "";
  let blocks = memoryBlocks.map((size, i) => ({
    size,
    allocated: false,
    element: createMemBlock(`Block ${i + 1}`, size, false),
    freeSize: size,
  }));

  blocks.forEach((b) => visualization.appendChild(b.element));

  status.textContent = "Starting First Fit Allocation...";

  const allocationData = [];

  for (let i = 0; i < processes.length; i++) {
    const pSize = processes[i];
    status.textContent = `Allocating Process ${i + 1} (${pSize} KB)...`;
    await delay(1000);

    let allocated = false;
    for (let j = 0; j < blocks.length; j++) {
      if (!blocks[j].allocated && blocks[j].size >= pSize) {
        blocks[j].allocated = true;
        const fragmentSize = blocks[j].size - pSize;
        blocks[j].freeSize = fragmentSize;
        blocks[j].element.classList.add("allocated");
        blocks[j].element.textContent = "";
        const memLabel = document.createElement("div");
        memLabel.className = "mem-label";
        memLabel.textContent = `Block ${j + 1}`;
        blocks[j].element.appendChild(memLabel);
        blocks[j].element.appendChild(
          document.createTextNode(`P${i + 1} (${pSize} KB)`)
        );
        animateAllocationBlock(blocks[j].element);

        allocationData.push([`P${i + 1}`, `${pSize} KB`, `Block ${j + 1}`]);

        if (fragmentSize > 0) {
          await delay(600);
          const fragBlock = {
            size: fragmentSize,
            allocated: false,
            element: createMemBlock(`Fragment`, fragmentSize, false),
            freeSize: fragmentSize,
          };
          blocks.splice(j + 1, 0, fragBlock);
          visualization.insertBefore(
            fragBlock.element,
            blocks[j].element.nextSibling
          );
        }

        allocated = true;
        break;
      }
      await delay(500); // animate searching next block
    }

    if (!allocated) {
      status.textContent = `Process ${
        i + 1
      } (${pSize} KB) could NOT be allocated (No fit found).`;
      allocationData.push([`P${i + 1}`, `${pSize} KB`, "Not Allocated"]);
      await delay(1500);
    } else {
      status.textContent = `Process ${
        i + 1
      } (${pSize} KB) allocated successfully.`;
      await delay(1000);
    }
  }

  let totalFree = blocks
    .filter((b) => !b.allocated)
    .reduce((a, b) => a + b.size, 0);
  status.textContent = `Allocation done. Total external fragmentation: ${totalFree} KB`;

  createTable(
    ["Process", "Size", "Allocated Block"],
    allocationData,
    resultsContainer
  );
}

// ==== Best Fit ====

function initBestFit() {
  setupInputArea("best-fit");

  document.getElementById("start-btn").onclick = async () => {
    await simulateBestFit();
  };
  document.getElementById("random-btn").onclick = populateRandomValuesBestFit;
}

function populateRandomValuesBestFit() {
  document.getElementById("memory-blocks").value = generateRandomSizes(
    5,
    100,
    1000
  );
  document.getElementById("processes").value = generateRandomSizes(5, 50, 500);
}

async function simulateBestFit() {
  const memInput = document.getElementById("memory-blocks").value;
  const procInput = document.getElementById("processes").value;
  const visualization = document.getElementById("visualization");
  const status = document.getElementById("status");

  let resultsContainer = document.getElementById("results-container");
  if (!resultsContainer) {
    resultsContainer = document.createElement("div");
    resultsContainer.id = "results-container";
    visualization.parentNode.insertBefore(
      resultsContainer,
      visualization.nextSibling
    );
  }
  resultsContainer.innerHTML = "";

  const memoryBlocks = parseSizes(memInput);
  const processes = parseSizes(procInput);

  if (memoryBlocks.length === 0 || processes.length === 0) {
    status.textContent = "Please enter valid memory blocks and processes.";
    return;
  }

  visualization.innerHTML = "";
  let blocks = memoryBlocks.map((size, i) => ({
    size,
    allocated: false,
    element: createMemBlock(`Block ${i + 1}`, size, false),
    freeSize: size,
  }));

  blocks.forEach((b) => visualization.appendChild(b.element));

  status.textContent = "Starting Best Fit Allocation...";

  const allocationData = [];

  for (let i = 0; i < processes.length; i++) {
    const pSize = processes[i];
    status.textContent = `Allocating Process ${i + 1} (${pSize} KB)...`;
    await delay(1000); // Find best fit block (smallest free block >= pSize)

    let bestIndex = -1;
    let bestSize = Infinity;

    for (let j = 0; j < blocks.length; j++) {
      if (
        !blocks[j].allocated &&
        blocks[j].size >= pSize &&
        blocks[j].size < bestSize
      ) {
        bestIndex = j;
        bestSize = blocks[j].size;
      }
      await delay(300); // visual search animation delay
    }

    if (bestIndex === -1) {
      status.textContent = `Process ${
        i + 1
      } (${pSize} KB) could NOT be allocated (No fit found).`;
      allocationData.push([`P${i + 1}`, `${pSize} KB`, "Not Allocated"]);
      await delay(1500);
      continue;
    } // Allocate block

    blocks[bestIndex].allocated = true;
    const fragmentSize = blocks[bestIndex].size - pSize;
    blocks[bestIndex].freeSize = fragmentSize;
    blocks[bestIndex].element.classList.add("allocated");
    blocks[bestIndex].element.textContent = "";
    const memLabel = document.createElement("div");
    memLabel.className = "mem-label";
    memLabel.textContent = `Block ${bestIndex + 1}`;
    blocks[bestIndex].element.appendChild(memLabel);
    blocks[bestIndex].element.appendChild(
      document.createTextNode(`P${i + 1} (${pSize} KB)`)
    );
    animateAllocationBlock(blocks[bestIndex].element);

    allocationData.push([`P${i + 1}`, `${pSize} KB`, `Block ${bestIndex + 1}`]);

    if (fragmentSize > 0) {
      await delay(600);
      const fragBlock = {
        size: fragmentSize,
        allocated: false,
        element: createMemBlock(`Fragment`, fragmentSize, false),
        freeSize: fragmentSize,
      };
      blocks.splice(bestIndex + 1, 0, fragBlock);
      visualization.insertBefore(
        fragBlock.element,
        blocks[bestIndex].element.nextSibling
      );
    }

    status.textContent = `Process ${
      i + 1
    } (${pSize} KB) allocated successfully.`;
    await delay(1000);
  }

  let totalFree = blocks
    .filter((b) => !b.allocated)
    .reduce((a, b) => a + b.size, 0);
  status.textContent = `Allocation done. Total external fragmentation: ${totalFree} KB`;

  createTable(
    ["Process", "Size", "Allocated Block"],
    allocationData,
    resultsContainer
  );
}

// ==== Next Fit ====

function initNextFit() {
  setupInputArea("next-fit");

  document.getElementById("start-btn").onclick = async () => {
    await simulateNextFit();
  };
  document.getElementById("random-btn").onclick = populateRandomValuesNextFit;
}

function populateRandomValuesNextFit() {
  document.getElementById("memory-blocks").value = generateRandomSizes(
    5,
    100,
    1000
  );
  document.getElementById("processes").value = generateRandomSizes(5, 50, 500);
}

async function simulateNextFit() {
  const memInput = document.getElementById("memory-blocks").value;
  const procInput = document.getElementById("processes").value;
  const visualization = document.getElementById("visualization");
  const status = document.getElementById("status");

  let resultsContainer = document.getElementById("results-container");
  if (!resultsContainer) {
    resultsContainer = document.createElement("div");
    resultsContainer.id = "results-container";
    visualization.parentNode.insertBefore(
      resultsContainer,
      visualization.nextSibling
    );
  }
  resultsContainer.innerHTML = "";

  const memoryBlocks = parseSizes(memInput);
  const processes = parseSizes(procInput);

  if (memoryBlocks.length === 0 || processes.length === 0) {
    status.textContent = "Please enter valid memory blocks and processes.";
    return;
  }

  visualization.innerHTML = "";
  let blocks = memoryBlocks.map((size, i) => ({
    size,
    allocated: false,
    element: createMemBlock(`Block ${i + 1}`, size, false),
    freeSize: size,
  }));

  blocks.forEach((b) => visualization.appendChild(b.element));

  status.textContent = "Starting Next Fit Allocation...";

  let lastIndex = 0;
  const allocationData = [];

  for (let i = 0; i < processes.length; i++) {
    const pSize = processes[i];
    status.textContent = `Allocating Process ${i + 1} (${pSize} KB)...`;
    await delay(1000);

    let allocated = false;
    let j = lastIndex;
    let searchedBlocks = 0;

    while (searchedBlocks < blocks.length) {
      if (!blocks[j].allocated && blocks[j].size >= pSize) {
        blocks[j].allocated = true;
        const fragmentSize = blocks[j].size - pSize;
        blocks[j].freeSize = fragmentSize;
        blocks[j].element.classList.add("allocated");
        blocks[j].element.textContent = "";
        const memLabel = document.createElement("div");
        memLabel.className = "mem-label";
        memLabel.textContent = `Block ${j + 1}`;
        blocks[j].element.appendChild(memLabel);
        blocks[j].element.appendChild(
          document.createTextNode(`P${i + 1} (${pSize} KB)`)
        );
        animateAllocationBlock(blocks[j].element);

        allocationData.push([`P${i + 1}`, `${pSize} KB`, `Block ${j + 1}`]);

        if (fragmentSize > 0) {
          await delay(600);
          const fragBlock = {
            size: fragmentSize,
            allocated: false,
            element: createMemBlock(`Fragment`, fragmentSize, false),
            freeSize: fragmentSize,
          };
          blocks.splice(j + 1, 0, fragBlock);
          visualization.insertBefore(
            fragBlock.element,
            blocks[j].element.nextSibling
          );
        }
        allocated = true;
        lastIndex = j;
        break;
      }
      j = (j + 1) % blocks.length;
      searchedBlocks++;
      await delay(300);
    }

    if (!allocated) {
      status.textContent = `Process ${
        i + 1
      } (${pSize} KB) could NOT be allocated (No fit found).`;
      allocationData.push([`P${i + 1}`, `${pSize} KB`, "Not Allocated"]);
      await delay(1500);
    } else {
      status.textContent = `Process ${
        i + 1
      } (${pSize} KB) allocated successfully.`;
      await delay(1000);
    }
  }

  let totalFree = blocks
    .filter((b) => !b.allocated)
    .reduce((a, b) => a + b.size, 0);
  status.textContent = `Allocation done. Total external fragmentation: ${totalFree} KB`;

  createTable(
    ["Process", "Size", "Allocated Block"],
    allocationData,
    resultsContainer
  );
}

// ==== Worst Fit ====

function initWorstFit() {
  setupInputArea("worst-fit");

  document.getElementById("start-btn").onclick = async () => {
    await simulateWorstFit();
  };
  document.getElementById("random-btn").onclick = populateRandomValuesWorstFit;
}

function populateRandomValuesWorstFit() {
  document.getElementById("memory-blocks").value = generateRandomSizes(
    5,
    100,
    1000
  );
  document.getElementById("processes").value = generateRandomSizes(5, 50, 500);
}

async function simulateWorstFit() {
  const memInput = document.getElementById("memory-blocks").value;
  const procInput = document.getElementById("processes").value;
  const visualization = document.getElementById("visualization");
  const status = document.getElementById("status");

  let resultsContainer = document.getElementById("results-container");
  if (!resultsContainer) {
    resultsContainer = document.createElement("div");
    resultsContainer.id = "results-container";
    visualization.parentNode.insertBefore(
      resultsContainer,
      visualization.nextSibling
    );
  }
  resultsContainer.innerHTML = "";

  const memoryBlocks = parseSizes(memInput);
  const processes = parseSizes(procInput);

  if (memoryBlocks.length === 0 || processes.length === 0) {
    status.textContent = "Please enter valid memory blocks and processes.";
    return;
  }

  visualization.innerHTML = "";
  let blocks = memoryBlocks.map((size, i) => ({
    size,
    allocated: false,
    element: createMemBlock(`Block ${i + 1}`, size, false),
    freeSize: size,
  }));

  blocks.forEach((b) => visualization.appendChild(b.element));

  status.textContent = "Starting Worst Fit Allocation...";

  const allocationData = [];

  for (let i = 0; i < processes.length; i++) {
    const pSize = processes[i];
    status.textContent = `Allocating Process ${i + 1} (${pSize} KB)...`;
    await delay(1000); // Find worst fit block (largest free block >= pSize)

    let worstIndex = -1;
    let worstSize = -1;

    for (let j = 0; j < blocks.length; j++) {
      if (
        !blocks[j].allocated &&
        blocks[j].size >= pSize &&
        blocks[j].size > worstSize
      ) {
        worstIndex = j;
        worstSize = blocks[j].size;
      }
      await delay(300);
    }

    if (worstIndex === -1) {
      status.textContent = `Process ${
        i + 1
      } (${pSize} KB) could NOT be allocated (No fit found).`;
      allocationData.push([`P${i + 1}`, `${pSize} KB`, "Not Allocated"]);
      await delay(1500);
      continue;
    }

    blocks[worstIndex].allocated = true;
    const fragmentSize = blocks[worstIndex].size - pSize;
    blocks[worstIndex].freeSize = fragmentSize;
    blocks[worstIndex].element.classList.add("allocated");
    blocks[worstIndex].element.textContent = "";
    const memLabel = document.createElement("div");
    memLabel.className = "mem-label";
    memLabel.textContent = `Block ${worstIndex + 1}`;
    blocks[worstIndex].element.appendChild(memLabel);
    blocks[worstIndex].element.appendChild(
      document.createTextNode(`P${i + 1} (${pSize} KB)`)
    );
    animateAllocationBlock(blocks[worstIndex].element);

    allocationData.push([
      `P${i + 1}`,
      `${pSize} KB`,
      `Block ${worstIndex + 1}`,
    ]);

    if (fragmentSize > 0) {
      await delay(600);
      const fragBlock = {
        size: fragmentSize,
        allocated: false,
        element: createMemBlock(`Fragment`, fragmentSize, false),
        freeSize: fragmentSize,
      };
      blocks.splice(worstIndex + 1, 0, fragBlock);
      visualization.insertBefore(
        fragBlock.element,
        blocks[worstIndex].element.nextSibling
      );
    }

    status.textContent = `Process ${
      i + 1
    } (${pSize} KB) allocated successfully.`;
    await delay(1000);
  }

  let totalFree = blocks
    .filter((b) => !b.allocated)
    .reduce((a, b) => a + b.size, 0);
  status.textContent = `Allocation done. Total external fragmentation: ${totalFree} KB`;

  createTable(
    ["Process", "Size", "Allocated Block"],
    allocationData,
    resultsContainer
  );
}

// ==== Paging ====

function initPaging() {
  setupInputArea("paging");

  document.getElementById("start-btn").onclick = async () => {
    await simulatePaging();
  };
  document.getElementById("random-btn").onclick = populateRandomValuesPaging;
}

function populateRandomValuesPaging() {
  const totalMemInput = document.getElementById("total-memory");
  const pageSizeInput = document.getElementById("page-size");
  const processesInput = document.getElementById("processes");

  let totalMem = Math.floor(Math.random() * (2048 - 512 + 1) + 512);
  let pageSize = [32, 64, 128, 256][Math.floor(Math.random() * 4)];
  totalMem = Math.ceil(totalMem / pageSize) * pageSize;

  totalMemInput.value = totalMem;
  pageSizeInput.value = pageSize;
  processesInput.value = generateRandomSizes(
    Math.floor(Math.random() * (6 - 3 + 1)) + 3,
    pageSize / 2,
    pageSize * 3
  );
}

async function simulatePaging() {
  const totalMem = parseInt(document.getElementById("total-memory").value);
  const pageSize = parseInt(document.getElementById("page-size").value);
  const procInput = document.getElementById("processes").value;
  const visualization = document.getElementById("visualization");
  const status = document.getElementById("status");

  let resultsContainer = document.getElementById("results-container");
  if (!resultsContainer) {
    resultsContainer = document.createElement("div");
    resultsContainer.id = "results-container";
    visualization.parentNode.insertBefore(
      resultsContainer,
      visualization.nextSibling
    );
  }
  resultsContainer.innerHTML = "";

  if (isNaN(totalMem) || totalMem <= 0 || isNaN(pageSize) || pageSize <= 0) {
    status.textContent = "Please enter valid total memory size and page size.";
    return;
  }

  const processes = parseSizes(procInput);

  if (processes.length === 0) {
    status.textContent = "Please enter valid processes sizes.";
    return;
  }

  visualization.innerHTML = "";
  status.textContent = "Starting Paging simulation...";

  const totalFrames = Math.floor(totalMem / pageSize);
  let frames = [];
  for (let i = 0; i < totalFrames; i++) {
    const frameBlock = createMemBlock(`Frame ${i}`, pageSize, false);
    visualization.appendChild(frameBlock);
    frames.push({
      index: i,
      allocated: false,
      element: frameBlock,
      process: null,
    });
  }

  const allocationData = [];
  let totalProcessMem = 0;

  for (let i = 0; i < processes.length; i++) {
    let pSize = processes[i];
    totalProcessMem += pSize;
    let pagesNeeded = Math.ceil(pSize / pageSize);
    status.textContent = `Allocating Process ${
      i + 1
    } (${pSize} KB, ${pagesNeeded} pages)...`;

    let freeFrames = frames.filter((f) => !f.allocated);

    if (freeFrames.length < pagesNeeded) {
      status.textContent = `Process ${
        i + 1
      } could NOT be allocated (not enough free frames).`;
      await delay(1500);
      continue;
    }

    for (let j = 0; j < pagesNeeded; j++) {
      let frame = freeFrames[j];
      frame.allocated = true;
      frame.process = i + 1;
      frame.element.classList.add("allocated");
      frame.element.textContent = "";
      const memLabel = document.createElement("div");
      memLabel.className = "mem-label";
      memLabel.textContent = `Frame ${frame.index}`;
      frame.element.appendChild(memLabel);
      frame.element.appendChild(document.createTextNode(`P${i + 1}`));
      allocationData.push([`P${i + 1}`, `Page ${j}`, `Frame ${frame.index}`]);
      await delay(500);
    }
    status.textContent = `Process ${i + 1} allocated ${pagesNeeded} pages.`;
    await delay(1000);
  }

  let allocatedFrames = frames.filter((f) => f.allocated).length;
  let totalAllocatedMem = allocatedFrames * pageSize;
  let internalFrag = totalAllocatedMem - totalProcessMem;

  status.textContent = `Paging done. Internal Fragmentation: ${internalFrag} KB`;

  createTable(
    ["Process", "Page", "Allocated Frame"],
    allocationData,
    resultsContainer
  );
}

// ==== Segmentation ====

function initSegmentation() {
  setupInputArea("segmentation");

  document.getElementById("start-btn").onclick = async () => {
    await simulateSegmentation();
  };
  document.getElementById("random-btn").onclick =
    populateRandomValuesSegmentation;
}

function populateRandomValuesSegmentation() {
  document.getElementById("memory-segments").value = generateRandomSizes(
    Math.floor(Math.random() * (7 - 4 + 1)) + 4,
    100,
    1000
  );
  const segmentNames = ["Stack", "Code", "Heap", "Data"];
  const processSegments = [];
  const count = Math.floor(Math.random() * (4 - 2 + 1)) + 2;
  for (let i = 0; i < count; i++) {
    const name = segmentNames[i];
    const size = Math.floor(Math.random() * (500 - 50 + 1)) + 50;
    processSegments.push(`${name}:${size}`);
  }
  document.getElementById("process-segments").value =
    processSegments.join(", ");
}

async function simulateSegmentation() {
  const memInput = document.getElementById("memory-segments").value;
  const procInput = document.getElementById("process-segments").value;
  const visualization = document.getElementById("visualization");
  const status = document.getElementById("status");

  let resultsContainer = document.getElementById("results-container");
  if (!resultsContainer) {
    resultsContainer = document.createElement("div");
    resultsContainer.id = "results-container";
    visualization.parentNode.insertBefore(
      resultsContainer,
      visualization.nextSibling
    );
  }
  resultsContainer.innerHTML = "";

  const memorySegments = parseSizes(memInput);
  const processSegments = parseNamedSegments(procInput);

  if (
    memorySegments.length === 0 ||
    Object.keys(processSegments).length === 0
  ) {
    status.textContent =
      "Please enter valid memory segments and process segments.";
    return;
  }

  visualization.innerHTML = "";

  let memSegs = memorySegments.map((size, i) => ({
    size,
    allocated: false,
    element: createMemBlock(`Memory Segment ${i + 1}`, size, false),
    freeSize: size,
    base: 0,
  }));

  let currentBase = 0;
  memSegs.forEach((seg) => {
    seg.base = currentBase;
    currentBase += seg.size;
    visualization.appendChild(seg.element);
  });

  status.textContent = "Starting Segmentation allocation...";

  const allocationData = [];
  let procIndex = 0;

  for (const segName in processSegments) {
    const pSize = processSegments[segName];
    status.textContent = `Allocating Process Segment '${segName}' (${pSize} KB)...`;
    await delay(1000);

    let allocated = false;

    for (let i = 0; i < memSegs.length; i++) {
      if (!memSegs[i].allocated && memSegs[i].size >= pSize) {
        const allocatedBase = memSegs[i].base;
        const fragmentSize = memSegs[i].size - pSize;

        memSegs[i].allocated = true;
        memSegs[i].freeSize = fragmentSize;
        memSegs[i].element.classList.add("allocated");
        memSegs[i].element.textContent = "";
        const memLabel = document.createElement("div");
        memLabel.className = "mem-label";
        memLabel.textContent = `${segName}`;
        memSegs[i].element.appendChild(memLabel);
        memSegs[i].element.appendChild(
          document.createTextNode(`Base: ${allocatedBase} Limit: ${pSize}`)
        );
        animateAllocationBlock(memSegs[i].element);

        allocationData.push([
          segName,
          `${pSize} KB`,
          `${allocatedBase} KB`,
          "Allocated",
        ]);

        if (fragmentSize > 0) {
          await delay(600);
          const fragBlock = {
            size: fragmentSize,
            allocated: false,
            element: createMemBlock(`Fragment`, fragmentSize, false),
            freeSize: fragmentSize,
            base: allocatedBase + pSize,
          };
          memSegs.splice(i + 1, 0, fragBlock);
          visualization.insertBefore(
            fragBlock.element,
            memSegs[i].element.nextSibling
          );
        }

        allocated = true;
        break;
      }
      await delay(300);
    }

    if (!allocated) {
      status.textContent = `Process Segment '${segName}' (${pSize} KB) could NOT be allocated.`;
      allocationData.push([segName, `${pSize} KB`, "N/A", "Not Allocated"]);
      await delay(1500);
    } else {
      status.textContent = `Process Segment '${segName}' allocated successfully.`;
      await delay(1000);
    }
    procIndex++;
  }

  let totalFree = memSegs
    .filter((b) => !b.allocated)
    .reduce((a, b) => a + b.size, 0);
  status.textContent = `Segmentation done. Total external fragmentation: ${totalFree} KB`;

  createTable(
    ["Segment Name", "Limit (Size)", "Base Address", "Status"],
    allocationData,
    resultsContainer
  );
}

// ==== Utility delay ====
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
