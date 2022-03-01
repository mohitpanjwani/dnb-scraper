<template>
  <div class="m-5 space-y-4">
    <div class="flex text-gray-500 items-center text-sm">
      Current Page:
      <span class="ml-1 text-lg text-gray-800">{{ currentPageNumber }}</span>
    </div>

    <div class="flex text-gray-500 items-center text-sm">
      Last Scraped Page:
      <span class="ml-1 text-lg text-gray-800">{{
        getLastScrapedPageNumber
      }}</span>
    </div>

    <div class="flex text-gray-500 items-center text-sm">
      Total Pages Scraped:
      <span class="ml-1 text-lg text-gray-800">{{ getTotalPagesScraped }}</span>
    </div>

    <div class="w-full text-center">
      <button
        id="download_btn"
        class="
          w-full
          inline-flex
          whitespace-nowrap
          border border-transparent
          font-medium
          px-4
          py-2
          text-sm
          leading-5
          rounded-md
          shadow-sm
          text-white
          disabled:disabled:bg-gray-400
        "
        :class="[
          !isDownloading
            ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
            : 'bg-emerald-400 hover:bg-emerald-500 focus:ring-emerald-300',
        ]"
        :disabled="isLoading || isScrapping"
        @click="downloadCSV"
      >
        <DownloadIcon v-if="!isDownloading" class="-ml-1 h-5 w-5 mr-2" />

        <svg
          v-else
          class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        {{ !isDownloading ? "Download" : "Processing..." }}
      </button>
    </div>
    <div class="flex justify-between gap-5">
      <button
        class="
          flex-1
          inline-flex
          whitespace-nowrap
          border border-transparent
          font-medium
          px-4
          py-2
          text-sm
          leading-5
          rounded-md
          shadow-sm
          text-white
          disabled:bg-gray-400
        "
        :class="[
          !isScrapping
            ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
            : 'bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-400',
        ]"
        :disabled="isLoading"
        @click="sendAction"
      >
        <PlayIcon
          v-if="!isScrapping"
          id="resume_icon"
          class="-ml-1 h-5 w-5 mr-2"
        />
        <PauseIcon v-else id="pause_icon" class="-ml-1 h-5 w-5 mr-2" />
        <span v-if="!isScrapping"> Start Scraping </span>
        <span v-else> Pause Scraping </span>
      </button>

      <button
        class="
          flex-1
          inline-flex
          whitespace-nowrap
          border border-transparent
          font-medium
          px-4
          py-2
          text-sm
          leading-5
          rounded-md
          shadow-sm
          text-white
          bg-gray-600
          hover:bg-gray-700
          focus:ring-gray-500
          disabled:bg-gray-400
        "
        :disabled="isLoading || isScrapping"
        @click="resetPage"
      >
        <RefreshIcon class="-ml-1 h-5 w-5 mr-2" />
        <span>Reset</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { RefreshIcon, PlayIcon, PauseIcon } from "@heroicons/vue/solid"
import { DownloadIcon } from "@heroicons/vue/outline"
import { sendMessage, onMessage } from "webext-bridge"
import { scrapeStorage, strLastScraped } from "~/logic"

const isLoading = ref(false)
const isScrapping = ref(false)
const isDownloading = ref(false)
const currentPageNumber = ref(0)
const lastPageNumber = ref(0)

onMounted(() => {
  isLoading.value = true
  send("init")
})

// get count of total scrapped page
const getTotalPagesScraped = computed(() => {
  return scrapeStorage.value ? Object.keys(scrapeStorage.value).length : 0
})
// get last scrapped page
const getLastScrapedPageNumber = computed(() => {
  return strLastScraped.value ? strLastScraped.value : 0
})

// scrap actions
function sendAction() {
  if (!isScrapping.value) {
    isScrapping.value = true
    send("start")
  }
  else {
    send("stop")
  }
}

// send message to content script
function send(action) {
  chrome.tabs.query({ currentWindow: true, active: true }, async(tabs) => {
    const activeTab = tabs[0].id
    // sendMessage(action, {}, `content-script@${activeTab}`)
    sendMessage(
      action,
      {
        currentPageNumber: currentPageNumber.value,
        lastPageNumber: lastPageNumber.value,
        scrapeStorage: scrapeStorage.value,
        totalPagesScraped: getTotalPagesScraped.value,
      },
      { context: "content-script", tabId: activeTab },
    )
  })
}

// reset page
function resetPage() {
  scrapeStorage.value = {}
  strLastScraped.value = 0
  send("init")
}

// Set Initial State
onMessage("setInitialData", ({ data }) => {
  currentPageNumber.value = data.currentPageNumber ? data.currentPageNumber : 1
  lastPageNumber.value = data.lastPageNumber ? data.lastPageNumber : 1
  isLoading.value = false
})
// stop srapping
onMessage("onStop", ({ data }) => {
  isScrapping.value = false
})

// change page
onMessage("changePage", ({ data }) => {
  console.log("change page", data)

  strLastScraped.value = data.page
  scrapeStorage.value[data.page] = data.data
  if (parseInt(data.lastPage) > parseInt(data.page)) {
    currentPageNumber.value = parseInt(data.page) + 1
    send("start")
  }
})

// download scrapped content
async function downloadCSV() {
  isDownloading.value = true

  if (!scrapeStorage.value) return

  let data = []

  Object.keys(scrapeStorage.value).forEach((key, index) => {
    data = data.concat(scrapeStorage.value[key])
  })

  setTimeout(() => {
    let csvContent = data.map(e => e.join(",")).join("\n")
    csvContent = `data:text/csv;charset=utf-8,${csvContent}`
    const encodedUri = encodeURI(csvContent)
    const downloadLink = document.createElement("a")
    downloadLink.download = `dnb.csv`
    downloadLink.href = encodedUri
    downloadLink.style.display = "none"
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    isDownloading.value = false
  }, 500)
}
</script>
