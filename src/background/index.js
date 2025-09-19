/*global chrome*/
// If your extension doesn't need a background script, just leave this file empty
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
}, 10 * 1000) // Reduced to 10 seconds for faster detection

// This needs to be an export due to typescript implementation limitation of needing '--isolatedModules' tsconfig
export function taskInBackground() {
  // Check if user has Gmail enabled first
  chrome.storage.local.get(['storage'], (storageResult) => {
    if (!storageResult.storage || !storageResult.storage.gmail) {
      chrome.action.setBadgeText({ text: '' })
      return
    }

    // Try to get Gmail data
    fetch('https://mail.google.com/mail/u/1/feed/atom', {
      method: 'GET',
      headers: {
        'Accept': 'application/atom+xml, application/xml, text/xml'
      }
    })
      .then(async (response) => {
        if (!response.ok) {
          // Mimic axios error structure for 401
          const error = new Error('Network response was not ok');
          error.response = { status: response.status };
          throw error;
        }
        const xml = await response.text();
        
        // Parse the XML response manually without xml2js
        const parsedData = parseGmailFeed(xml);
        console.log(parsedData, '=============parsedData=============>')
        if (parsedData && parsedData.entries) {
          chrome.action.setBadgeBackgroundColor({ color: '#005282' })

          let count = 0
          let newEmails = []
          let allUnreadEmails = []
            
          chrome.storage.local.get(['lastProcessedEmails'], (result) => {
            let lastProcessedEmails = result.lastProcessedEmails || []

            // Get all unread emails (including spam)
            allUnreadEmails = parsedData.entries
            count = allUnreadEmails.length
              
            // Find truly new emails (not processed before)
            for (let i = 0; i < allUnreadEmails.length; i++) {
              let emailId = allUnreadEmails[i].id
              if (!lastProcessedEmails.includes(emailId)) {
                newEmails.push(allUnreadEmails[i])
              }
            }
              
            chrome.action.setBadgeText({
              text: count === 0 ? '' : count >= 20 ? '20+' : count.toString(),
            })
              
            console.log('Total unread emails:', count)
            console.log('New emails to process:', newEmails.length)
              
            // Send Telegram notifications for new emails immediately
            if (newEmails.length > 0) {
              console.log('Sending new emails to Telegram immediately')
              sendNewEmailsToTelegram(newEmails)
                
              // Update last processed emails list
              let updatedProcessedEmails = [...lastProcessedEmails, ...newEmails.map(email => email.id)]
              // Keep only last 100 emails to avoid storage bloat
              if (updatedProcessedEmails.length > 100) {
                updatedProcessedEmails = updatedProcessedEmails.slice(-100)
              }
              chrome.storage.local.set({ lastProcessedEmails: updatedProcessedEmails }, () => {
                console.log('Updated processed emails list')
              })
            }
          })
            
          let isGmailLogedIn = true
          chrome.storage.local.set({ isGmailLogedIn }, function () {})
        } else {
          console.log('No valid email data found in response')
          chrome.action.setBadgeText({ text: '' })
        }
      })
      .catch(function (error) {
        console.log('Gmail feed error:', error)
        
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

    // Send each new email as a separate notification immediately
    for (const email of newEmails) {
      await sendTelegramNotification(email)
      // Reduced delay for faster notifications
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  } catch (error) {
    console.log('Error sending emails to Telegram:', error)
  }
}

// Custom XML parser for Gmail Atom feed
function parseGmailFeed(xmlString) {
  try {
    // Check if the response contains valid XML
    if (!xmlString || !xmlString.includes('<?xml') || !xmlString.includes('<feed')) {
      console.log('Invalid XML response:', xmlString.substring(0, 200))
      return null
    }

    // Simple regex-based parsing for Gmail Atom feed
    const entryRegex = /<entry[^>]*>(.*?)<\/entry>/gs
    const entries = []
    let match

    while ((match = entryRegex.exec(xmlString)) !== null) {
      const entryXml = match[1]
      const entry = parseEntry(entryXml)
      if (entry) {
        entries.push(entry)
      }
    }

    return { entries }
  } catch (error) {
    console.log('Error parsing Gmail feed:', error)
    return null
  }
}

// Parse individual email entry
function parseEntry(entryXml) {
  try {
    const getTextContent = (tagName) => {
      const regex = new RegExp(`<${tagName}[^>]*>(.*?)</${tagName}>`, 's')
      const match = entryXml.match(regex)
      return match ? match[1].trim() : ''
    }

    const getAttribute = (tagName, attrName) => {
      const regex = new RegExp(`<${tagName}[^>]*${attrName}="([^"]*)"`, 's')
      const match = entryXml.match(regex)
      return match ? match[1] : ''
    }

    const id = getTextContent('id').trim()
    const title = getTextContent('title').trim()  
    const summary = getTextContent('summary').trim()
    const issued = getTextContent('issued').trim()
    const modified = getTextContent('modified').trim()
    
    // Parse author
    const authorName = getTextContent('name').trim()
    const authorEmail = getTextContent('email').trim()
    
    // Parse link
    const linkHref = getAttribute('link', 'href').trim()

    if (!id || !title) {
      return null
    }

    return {
      id,
      title: [title],
      summary: summary ? [summary] : [''],
      issued: [issued],
      modified: [modified],
      author: [{
        name: [authorName],
        email: [authorEmail]
      }],
      link: [{
        $: { href: linkHref }
      }]
    }
  } catch (error) {
    console.log('Error parsing entry:', error)
    return null
  }
}
