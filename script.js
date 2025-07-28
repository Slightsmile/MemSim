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

    case "info":
      // No JS needed on info page
      break;

    default:
      // unknown page
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

// FadeIn animation keyframes added via JS on load
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes fadeIn {
  0% {opacity: 0; transform: translateY(15px);}
  100% {opacity: 1; transform: translateY(0);}
}`;
document.head.appendChild(styleSheet);

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
  setupInputArea("First Fit Allocation", "first-fit");

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

function setupInputArea(title, pageType) {
  const inputArea = document.getElementById("input-area");
  const visualization = document.getElementById("visualization");
  const status = document.getElementById("status");
  if (!inputArea || !visualization || !status) return;

  let inputsHtml = "";
  if (pageType === "paging") {
    inputsHtml = `
      <label>Total Memory Size (KB):</label><br/>
      <input id="total-memory" type="number" placeholder="e.g. 1024" style="width: 80%;" /><br/>
      <label>Page Size (KB):</label><br/>
      <input id="page-size" type="number" placeholder="e.g. 128" style="width: 80%;" /><br/>
      <label>Processes (comma separated sizes):</label><br/>
      <input id="processes" type="text" placeholder="200, 450, 100, 300" style="width: 80%;" /><br/>
    `;
  } else if (pageType === "segmentation") {
    inputsHtml = `
      <label>Memory Segments (comma separated sizes):</label><br/>
      <input id="memory-segments" type="text" placeholder="100, 500, 200, 300, 600" style="width: 80%;" /><br/>
      <label>Process Segments (comma separated sizes):</label><br/>
      <input id="process-segments" type="text" placeholder="212, 417, 112, 426" style="width: 80%;" /><br/>
    `;
  } else {
    // For First Fit, Best Fit, Next Fit, Worst Fit
    inputsHtml = `
      <label>Memory Blocks (comma separated sizes):</label><br/>
      <input id="memory-blocks" type="text" placeholder="100, 500, 200, 300, 600" style="width: 80%;" /><br/>
      <label>Processes (comma separated sizes):</label><br/>
      <input id="processes" type="text" placeholder="212, 417, 112, 426" style="width: 80%;" /><br/>
    `;
  }

  inputArea.innerHTML = `
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

  const memoryBlocks = parseSizes(memInput);
  const processes = parseSizes(procInput);

  if (memoryBlocks.length === 0 || processes.length === 0) {
    status.textContent = "Please enter valid memory blocks and processes.";
    return;
  }

  // Show memory blocks initially (free)
  visualization.innerHTML = "";
  let blocks = memoryBlocks.map((size, i) => ({
    size,
    allocated: false,
    element: createMemBlock(`Block ${i + 1}`, size, false),
    freeSize: size,
  }));

  blocks.forEach((b) => visualization.appendChild(b.element));

  status.textContent = "Starting First Fit Allocation...";

  // Allocate each process
  for (let i = 0; i < processes.length; i++) {
    const pSize = processes[i];
    status.textContent = `Allocating Process ${i + 1} (${pSize} KB)...`;
    await delay(1000);

    let allocated = false;
    for (let j = 0; j < blocks.length; j++) {
      if (!blocks[j].allocated && blocks[j].size >= pSize) {
        // allocate block to process
        blocks[j].allocated = true;
        blocks[j].freeSize = blocks[j].size - pSize;
        blocks[j].element.classList.add("allocated");
        blocks[j].element.textContent = "";
        const memLabel = document.createElement("div");
        memLabel.className = "mem-label";
        memLabel.textContent = `Block ${j + 1}`;
        blocks[j].element.appendChild(memLabel);
        blocks[j].element.appendChild(
          document.createTextNode(`${pSize} KB Allocated`)
        );
        animateAllocationBlock(blocks[j].element);

        // If leftover fragment exists, show it as a new block after delay
        if (blocks[j].freeSize > 0) {
          await delay(600);
          const fragBlock = {
            size: blocks[j].freeSize,
            allocated: false,
            element: createMemBlock(`Fragment`, blocks[j].freeSize, false),
            freeSize: blocks[j].freeSize,
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
      await delay(1500);
    } else {
      status.textContent = `Process ${
        i + 1
      } (${pSize} KB) allocated successfully.`;
      await delay(1000);
    }
  }

  // Show fragmentation summary
  let totalFree = blocks
    .filter((b) => !b.allocated)
    .reduce((a, b) => a + b.size, 0);
  status.textContent = `Allocation done. Total external fragmentation: ${totalFree} KB`;
}

// ==== Best Fit ====

function initBestFit() {
  setupInputArea("Best Fit Allocation", "best-fit");

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

  for (let i = 0; i < processes.length; i++) {
    const pSize = processes[i];
    status.textContent = `Allocating Process ${i + 1} (${pSize} KB)...`;
    await delay(1000);

    // Find best fit block (smallest free block >= pSize)
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
      await delay(1500);
      continue;
    }

    // Allocate block
    blocks[bestIndex].allocated = true;
    blocks[bestIndex].freeSize = blocks[bestIndex].size - pSize;
    blocks[bestIndex].element.classList.add("allocated");
    blocks[bestIndex].element.textContent = "";
    const memLabel = document.createElement("div");
    memLabel.className = "mem-label";
    memLabel.textContent = `Block ${bestIndex + 1}`;
    blocks[bestIndex].element.appendChild(memLabel);
    blocks[bestIndex].element.appendChild(
      document.createTextNode(`${pSize} KB Allocated`)
    );
    animateAllocationBlock(blocks[bestIndex].element);

    if (blocks[bestIndex].freeSize > 0) {
      await delay(600);
      const fragBlock = {
        size: blocks[bestIndex].freeSize,
        allocated: false,
        element: createMemBlock(`Fragment`, blocks[bestIndex].freeSize, false),
        freeSize: blocks[bestIndex].freeSize,
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
}

// ==== Next Fit ====

function initNextFit() {
  setupInputArea("Next Fit Allocation", "next-fit");

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
        blocks[j].freeSize = blocks[j].size - pSize;
        blocks[j].element.classList.add("allocated");
        blocks[j].element.textContent = "";
        const memLabel = document.createElement("div");
        memLabel.className = "mem-label";
        memLabel.textContent = `Block ${j + 1}`;
        blocks[j].element.appendChild(memLabel);
        blocks[j].element.appendChild(
          document.createTextNode(`${pSize} KB Allocated`)
        );
        animateAllocationBlock(blocks[j].element);
        if (blocks[j].freeSize > 0) {
          await delay(600);
          const fragBlock = {
            size: blocks[j].freeSize,
            allocated: false,
            element: createMemBlock(`Fragment`, blocks[j].freeSize, false),
            freeSize: blocks[j].freeSize,
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
}

// ==== Worst Fit ====

function initWorstFit() {
  setupInputArea("Worst Fit Allocation", "worst-fit");

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

  for (let i = 0; i < processes.length; i++) {
    const pSize = processes[i];
    status.textContent = `Allocating Process ${i + 1} (${pSize} KB)...`;
    await delay(1000);

    // Find worst fit block (largest free block >= pSize)
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
      await delay(1500);
      continue;
    }

    blocks[worstIndex].allocated = true;
    blocks[worstIndex].freeSize = blocks[worstIndex].size - pSize;
    blocks[worstIndex].element.classList.add("allocated");
    blocks[worstIndex].element.textContent = "";
    const memLabel = document.createElement("div");
    memLabel.className = "mem-label";
    memLabel.textContent = `Block ${worstIndex + 1}`;
    blocks[worstIndex].element.appendChild(memLabel);
    blocks[worstIndex].element.appendChild(
      document.createTextNode(`${pSize} KB Allocated`)
    );
    animateAllocationBlock(blocks[worstIndex].element);

    if (blocks[worstIndex].freeSize > 0) {
      await delay(600);
      const fragBlock = {
        size: blocks[worstIndex].freeSize,
        allocated: false,
        element: createMemBlock(`Fragment`, blocks[worstIndex].freeSize, false),
        freeSize: blocks[worstIndex].freeSize,
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
}

// ==== Paging ====

function initPaging() {
  setupInputArea("Paging Simulation", "paging");

  document.getElementById("start-btn").onclick = async () => {
    await simulatePaging();
  };
  document.getElementById("random-btn").onclick = populateRandomValuesPaging;
}

function populateRandomValuesPaging() {
  const totalMemInput = document.getElementById("total-memory");
  const pageSizeInput = document.getElementById("page-size");
  const processesInput = document.getElementById("processes");

  // Random total memory, ensure it's a multiple of a reasonable page size
  let totalMem = Math.floor(Math.random() * (2048 - 512 + 1) + 512); // 512KB to 2048KB
  let pageSize = [32, 64, 128, 256][Math.floor(Math.random() * 4)]; // Common page sizes
  totalMem = Math.ceil(totalMem / pageSize) * pageSize; // Ensure total memory is a multiple of page size

  totalMemInput.value = totalMem;
  pageSizeInput.value = pageSize;
  processesInput.value = generateRandomSizes(
    Math.floor(Math.random() * (6 - 3 + 1)) + 3, // 3 to 6 processes
    pageSize / 2,
    pageSize * 3
  ); // Process sizes relative to page size
}

async function simulatePaging() {
  const totalMem = parseInt(document.getElementById("total-memory").value);
  const pageSize = parseInt(document.getElementById("page-size").value);
  const procInput = document.getElementById("processes").value;
  const visualization = document.getElementById("visualization");
  const status = document.getElementById("status");

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

  // Calculate total number of frames
  const totalFrames = Math.floor(totalMem / pageSize);
  // Visualize all frames as free blocks initially
  let frames = [];
  for (let i = 0; i < totalFrames; i++) {
    const frameBlock = createMemBlock(`Frame ${i + 1}`, pageSize, false);
    visualization.appendChild(frameBlock);
    frames.push({
      index: i,
      allocated: false,
      element: frameBlock,
      process: null,
    });
  }

  // Allocate pages for each process
  for (let i = 0; i < processes.length; i++) {
    let pSize = processes[i];
    let pagesNeeded = Math.ceil(pSize / pageSize);
    status.textContent = `Allocating Process ${
      i + 1
    } (${pSize} KB, ${pagesNeeded} pages)...`;

    // Find free frames for this process
    let freeFrames = frames.filter((f) => !f.allocated);

    if (freeFrames.length < pagesNeeded) {
      status.textContent = `Process ${
        i + 1
      } could NOT be allocated (not enough free frames).`;
      await delay(1500);
      continue;
    }

    // Allocate pages sequentially
    for (let j = 0; j < pagesNeeded; j++) {
      let frame = freeFrames[j];
      frame.allocated = true;
      frame.process = i + 1;
      frame.element.classList.add("allocated");
      frame.element.textContent = "";
      const memLabel = document.createElement("div");
      memLabel.className = "mem-label";
      memLabel.textContent = `Frame ${frame.index + 1}`;
      frame.element.appendChild(memLabel);
      frame.element.appendChild(document.createTextNode(`P${i + 1}`));
      await delay(500);
    }
    status.textContent = `Process ${i + 1} allocated ${pagesNeeded} pages.`;
    await delay(1000);
  }

  // Calculate fragmentation: internal fragmentation = total allocated frames * pageSize - sum of process sizes
  let allocatedFrames = frames.filter((f) => f.allocated).length;
  let totalAllocatedMem = allocatedFrames * pageSize;
  let totalProcessMem = processes.reduce((a, b) => a + b, 0);
  let internalFrag = totalAllocatedMem - totalProcessMem;

  status.textContent = `Paging done. Internal Fragmentation: ${internalFrag} KB`;
}

// ==== Segmentation ====

function initSegmentation() {
  setupInputArea("Segmentation Allocation", "segmentation");

  document.getElementById("start-btn").onclick = async () => {
    await simulateSegmentation();
  };
  document.getElementById("random-btn").onclick =
    populateRandomValuesSegmentation;
}

function populateRandomValuesSegmentation() {
  document.getElementById("memory-segments").value = generateRandomSizes(
    Math.floor(Math.random() * (7 - 4 + 1)) + 4, // 4 to 7 memory segments
    100,
    1000
  );
  document.getElementById("process-segments").value = generateRandomSizes(
    Math.floor(Math.random() * (6 - 3 + 1)) + 3, // 3 to 6 process segments
    50,
    700
  );
}

async function simulateSegmentation() {
  const memInput = document.getElementById("memory-segments").value;
  const procInput = document.getElementById("process-segments").value;
  const visualization = document.getElementById("visualization");
  const status = document.getElementById("status");

  const memorySegments = parseSizes(memInput);
  const processSegments = parseSizes(procInput);

  if (memorySegments.length === 0 || processSegments.length === 0) {
    status.textContent =
      "Please enter valid memory segments and process segments.";
    return;
  }

  visualization.innerHTML = "";

  // Show memory segments as free
  let memSegs = memorySegments.map((size, i) => ({
    size,
    allocated: false,
    element: createMemBlock(`Segment ${i + 1}`, size, false),
    freeSize: size,
  }));

  memSegs.forEach((b) => visualization.appendChild(b.element));
  status.textContent = "Starting Segmentation allocation...";

  // Allocate each process segment to first suitable memory segment (like First Fit)
  let procIndex = 0;

  while (procIndex < processSegments.length) {
    let pSize = processSegments[procIndex];
    status.textContent = `Allocating Process Segment ${
      procIndex + 1
    } (${pSize} KB)...`;
    await delay(1000);

    let allocated = false;

    for (let i = 0; i < memSegs.length; i++) {
      if (!memSegs[i].allocated && memSegs[i].size >= pSize) {
        memSegs[i].allocated = true;
        memSegs[i].freeSize = memSegs[i].size - pSize;
        memSegs[i].element.classList.add("allocated");
        memSegs[i].element.textContent = "";
        const memLabel = document.createElement("div");
        memLabel.className = "mem-label";
        memLabel.textContent = `Segment ${i + 1}`;
        memSegs[i].element.appendChild(memLabel);
        memSegs[i].element.appendChild(
          document.createTextNode(`${pSize} KB Allocated`)
        );
        animateAllocationBlock(memSegs[i].element);

        if (memSegs[i].freeSize > 0) {
          await delay(600);
          const fragBlock = {
            size: memSegs[i].freeSize,
            allocated: false,
            element: createMemBlock(`Fragment`, memSegs[i].freeSize, false),
            freeSize: memSegs[i].freeSize,
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
      status.textContent = `Process Segment ${
        procIndex + 1
      } (${pSize} KB) could NOT be allocated.`;
      await delay(1500);
    } else {
      status.textContent = `Process Segment ${
        procIndex + 1
      } allocated successfully.`;
      await delay(1000);
    }
    procIndex++;
  }

  let totalFree = memSegs
    .filter((b) => !b.allocated)
    .reduce((a, b) => a + b.size, 0);
  status.textContent = `Segmentation done. Total external fragmentation: ${totalFree} KB`;
}

// ==== Utility delay ====
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
