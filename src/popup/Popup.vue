<template>
  <div class="m-5 space-y-4">
    <dl class="mt-5 grid grid-cols-1 gap-5">
      <div
        class="px-2 py-3 bg-indigo-500 shadow rounded-lg overflow-hidden sm:p-6"
      >
        <dt class="text-sm font-medium text-gray-200 truncate">
          Current Page
        </dt>
        <dd class="mt-1 text-3xl font-semibold text-white">
          {{ currentPageNumber }}
        </dd>
      </div>

      <div
        class="px-2 py-3 bg-gray-100 shadow rounded-lg overflow-hidden sm:p-6"
      >
        <dt class="text-sm font-medium text-gray-500 truncate">
          Last Scraped Page
        </dt>
        <dd class="mt-1 text-3xl font-semibold text-gray-900">
          {{ lastScrapedPageNumber }}
        </dd>
      </div>

      <div
        class="px-2 py-3 bg-gray-100 shadow rounded-lg overflow-hidden sm:p-6"
      >
        <dt class="text-sm font-medium text-gray-500 truncate">
          Total Pages Scraped
        </dt>
        <dd class="mt-1 text-3xl font-semibold text-gray-900">
          {{ totalPagesScraped }}
        </dd>
      </div>
    </dl>

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
          justify-center
        "
        :class="[
          !isDownloading
            ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
            : 'bg-emerald-400 hover:bg-emerald-500 focus:ring-emerald-300',
        ]"
        :disabled="totalPagesScraped == 0 || isScraping || isDownloading"
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
          !isScraping
            ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
            : 'bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-400',
        ]"
        :disabled="isLoading"
        @click="sendAction"
      >
        <PlayIcon
          v-if="!isScraping"
          id="resume_icon"
          class="-ml-1 h-5 w-5 mr-2"
        />
        <PauseIcon v-else id="pause_icon" class="-ml-1 h-5 w-5 mr-2" />
        <span v-if="!isScraping"> Start Scraping </span>
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
        :disabled="isLoading || isScraping"
        @click="resetData"
      >
        <RefreshIcon class="-ml-1 h-5 w-5 mr-2" />
        <span>Reset Data</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { RefreshIcon, PlayIcon, PauseIcon } from "@heroicons/vue/solid"
import { DownloadIcon } from "@heroicons/vue/outline"
import { sendMessage, onMessage } from "webext-bridge"

const isLoading = ref(false)
const isScraping = ref(false)
const isDownloading = ref(false)
const currentPageNumber = ref(0)
const lastPageNumber = ref(0)
const lastScrapedPageNumber = ref(0)
const totalPagesScraped = ref(0)

onMounted(() => {
  isLoading.value = true
  send("init", "background")
})

// send message to defined context "content-script" | "popup" | "devtools" | "background"
function send(action, context, data = {}) {
  chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    const activeTab = tabs[0]?.id
    Object.assign(data, { tabId: activeTab })
    sendMessage(action, data, { context, tabId: activeTab })
  })
}

// scrape actions
function sendAction() {
  if (!isScraping.value) {
    isScraping.value = true
    send("start", "background")
  }
  else {
    send("stop", "content-script")
  }
}
// reset data
function resetData() {
  send("reset", "background")
}

// reset state
onMessage("resetState", ({ data }) => {
  totalPagesScraped.value = data.totalPagesScraped
  lastScrapedPageNumber.value = data.lastScrapedPageNumber
})

// set page info
onMessage("setPageInfo", ({ data }) => {
  isLoading.value = data.isLoading ? data.isLoading : false
  isScraping.value = data.isScraping ? data.isScraping : false
  currentPageNumber.value = data.currentPageNumber ? data.currentPageNumber : 1
  lastPageNumber.value = data.lastPageNumber ? data.lastPageNumber : 1
  lastScrapedPageNumber.value = data.lastScrapedPageNumber
    ? data.lastScrapedPageNumber
    : 0
  totalPagesScraped.value = data.totalPagesScraped ? data.totalPagesScraped : 0
})

// stop scraping
onMessage("stopScraping", () => {
  isScraping.value = false
})

// update current page number through goto change number
onMessage("updateCurrentPageNumber", ({ data }) => {
  currentPageNumber.value = data.currentPageNumber ? data.currentPageNumber : 1
})

onMessage("downloadData", ({ data }) => {
  if (!data.totalPagesScraped) return false

  let scrapeData = []

  Object.keys(data.scrapeStorage).forEach((key, index) => {
    scrapeData = scrapeData.concat(data.scrapeStorage[key])
  })

  setTimeout(() => {
    let csvContent = scrapeData.map(e => e.join(",")).join("\n")
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
})

// download scraped content
function downloadCSV() {
  isDownloading.value = true
  send("getScrapedStorageData", "background")
}
</script>
