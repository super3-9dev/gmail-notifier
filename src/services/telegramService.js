/*global chrome*/
import axios from 'axios'

export const sendTelegramNotification = async (emailData) => {
  try {
    // Get Telegram settings from storage
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['telegramEnabled', 'telegramBotToken', 'telegramChatId'], resolve)
    })

    if (!result.telegramEnabled || !result.telegramBotToken || !result.telegramChatId) {
      console.log('Telegram not configured')
      return false
    }

    // Format the email data for Telegram
    const message = formatEmailForTelegram(emailData)
    
    // Send message to Telegram
    const response = await axios.post(`https://api.telegram.org/bot${result.telegramBotToken}/sendMessage`, {
      chat_id: result.telegramChatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })

    if (response.data.ok) {
      console.log('Telegram notification sent successfully')
      return true
    } else {
      console.log('Failed to send Telegram notification:', response.data)
      return false
    }
  } catch (error) {
    console.log('Telegram notification error:', error)
    return false
  }
}

const formatEmailForTelegram = (emailData) => {
  const { author, title, summary, link, issued } = emailData
  
  const authorName = author[0].name[0]
  const emailTitle = title[0]
  const emailSummary = summary ? summary[0] : ''
  const emailLink = link[0].$.href
  const emailDate = new Date(issued[0]).toLocaleString()
  
  // Truncate summary if too long
  const truncatedSummary = emailSummary.length > 200 
    ? emailSummary.substring(0, 200) + '...' 
    : emailSummary

  return `📧 <b>New Gmail Message</b>

👤 <b>From:</b> ${authorName}
📝 <b>Subject:</b> ${emailTitle}
🕒 <b>Time:</b> ${emailDate}

${truncatedSummary ? `📄 <b>Preview:</b>\n${truncatedSummary}\n` : ''}
🔗 <a href="${emailLink}">Open in Gmail</a>`
}

export const testTelegramConnection = async (botToken, chatId) => {
  try {
    const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: '🔔 Blue Bell Gmail Notifier test message!\n\nIf you receive this, your Telegram integration is working correctly.',
      parse_mode: 'HTML'
    })

    return response.data.ok
  } catch (error) {
    console.log('Telegram test error:', error)
    return false
  }
}
