/*global chrome*/
// If your extension doesn't need a background script, just leave this file empty
import axios from 'axios'
import xml2js from 'xml2js'
import { sendTelegramNotification } from '../services/telegramService'

chrome.storage.local.get(['storage'], (result) => {
  if (result.storage && result.storage.gmail) {
    taskInBackground()
  } else {
    chrome.action.setBadgeText({ text: '' })
  }
})

setInterval(function () {
  chrome.storage.local.get(['storage'], (result) => {
    if (result.storage && result.storage.gmail) {
      taskInBackground()
    } else {
      chrome.action.setBadgeText({ text: '' })
    }
  })
}, 20 * 1000)

// This needs to be an export due to typescript implementation limitation of needing '--isolatedModules' tsconfig
export function taskInBackground() {
  // Check if user has Gmail enabled first
  chrome.storage.local.get(['storage'], (storageResult) => {
    if (!storageResult.storage || !storageResult.storage.gmail) {
      chrome.action.setBadgeText({ text: '' })
      return
    }

    // Try to get Gmail data
    axios
      .get('https://mail.google.com/mail/u/1/feed/atom', {
        timeout: 10000,
        headers: {
          'Accept': 'application/atom+xml, application/xml, text/xml'
        }
      })
      .then(function (response) {
        const xml = response.data
        xml2js.parseString(xml, (err, apiResponse) => {
          if (err) {
            console.log('XML parsing error:', err)
            return
          }
          
          chrome.action.setBadgeBackgroundColor({ color: '#005282' })

          let count = 0
          let newEmails = []
          chrome.storage.local.get(['readTime'], (result) => {
            let lastReadTime = result.readTime ? new Date(result.readTime) : new Date(0)

            if (apiResponse.feed && apiResponse.feed.entry) {
              for (let i = 0; i < apiResponse.feed.entry.length; i++) {
                let mDate = new Date(apiResponse.feed.entry[i].modified[0])
                if (mDate > lastReadTime) {
                  count++
                  newEmails.push(apiResponse.feed.entry[i])
                }
              }
              chrome.action.setBadgeText({
                text: count === 0 ? '' : count >= 20 ? '20+' : count.toString(),
              })
              console.log('newEmails', newEmails)
              // Send Telegram notifications for new emails
              if (newEmails.length > 0) {
                console.log('sending new emails to telegram')
                sendNewEmailsToTelegram(newEmails)
              }
            } else {
              chrome.action.setBadgeText({ text: '' })
            }
          })
          
          let isGmailLogedIn = true
          chrome.storage.local.set({ isGmailLogedIn }, function () {})
        })
      })
      .catch(function (error) {
        console.log('Gmail feed error:', error.message)
        
        // Only set as not logged in if it's a clear authentication error
        if (error.response && error.response.status === 401) {
          let isGmailLogedIn = false
          chrome.storage.local.set({ isGmailLogedIn }, function () {})

          chrome.action.setBadgeBackgroundColor({ color: 'red' })
          chrome.action.setBadgeText({
            text: '!',
          })
        } else {
          // For other errors (network, timeout, etc.), don't change login status
          console.log('Gmail feed error (not auth):', error.message)
        }
      })
  })
}

// Function to send new emails to Telegram
const sendNewEmailsToTelegram = async (newEmails) => {
  try {
    // Get Telegram settings
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['telegramEnabled', 'telegramBotToken', 'telegramChatId'], resolve)
    })

    if (!result.telegramEnabled || !result.telegramBotToken || !result.telegramChatId) {
      console.log('Telegram not configured, skipping notifications')
      return
    }

    // Send each new email as a separate notification
    for (const email of newEmails) {
      await sendTelegramNotification(email)
      // Add a small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  } catch (error) {
    console.log('Error sending emails to Telegram:', error)
  }
}
