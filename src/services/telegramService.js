/*global chrome*/
// import axios from 'axios'

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
    const response = await fetch(`https://api.telegram.org/bot${result.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: result.telegramChatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });
    const data = await response.json();
    if (data.ok) {
      console.log('Telegram notification sent successfully')
      return true
    } else {
      console.log('Failed to send Telegram notification:', data)
      return false
    }
  } catch (error) {
    console.log('Telegram notification error:', error)
    return false
  }
}

const formatEmailForTelegram = (emailData) => {
  const { author, title, summary, link, issued } = emailData
  
  const authorName = author[0].name[0].trim()
  const emailTitle = title[0].trim()
  const emailSummary = summary ? summary[0].trim() : ''
  const emailLink = link[0].$.href.trim()
  const emailDate = new Date(issued[0].trim()).toLocaleString()
  
  // Check if it might be spam based on common spam indicators
  const isSpam = checkIfSpam(authorName, emailTitle, emailSummary)
  const spamIndicator = isSpam ? '🚨 <b>POTENTIAL SPAM</b>\n\n' : ''
  
  // Truncate summary if too long
  const truncatedSummary = emailSummary.length > 200 
    ? emailSummary.substring(0, 200) + '...' 
    : emailSummary

  return `${spamIndicator}📧 <b>New Gmail Message</b>

👤 <b>From:</b> ${authorName}
📝 <b>Subject:</b> ${emailTitle}
🕒 <b>Time:</b> ${emailDate}

${truncatedSummary ? `📄 <b>Preview:</b>\n${truncatedSummary}\n` : ''}
🔗 <a href="${emailLink}">Open in Gmail</a>`
}

// Simple spam detection based on common patterns
const checkIfSpam = (author, subject, summary) => {
  const spamKeywords = [
    'free', 'win', 'congratulations', 'urgent', 'act now', 'limited time',
    'click here', 'unsubscribe', 'viagra', 'casino', 'lottery', 'winner',
    'guaranteed', 'no obligation', 'risk free', 'special offer', 'discount',
    'sale', 'promotion', 'deal', 'offer', 'bonus', 'cash', 'money',
    'investment', 'trading', 'crypto', 'bitcoin', 'forex', 'loan',
    'credit', 'debt', 'refinance', 'mortgage', 'insurance'
  ]
  
  const text = `${author} ${subject} ${summary}`.toLowerCase()
  
  // Check for multiple spam keywords
  const spamCount = spamKeywords.filter(keyword => text.includes(keyword)).length
  
  // Check for excessive caps
  const capsRatio = (subject.match(/[A-Z]/g) || []).length / subject.length
  
  // Check for excessive punctuation
  const punctuationCount = (subject.match(/[!]{2,}|[?]{2,}/g) || []).length
  
  return spamCount >= 2 || capsRatio > 0.5 || punctuationCount > 0
}

export const testTelegramConnection = async (botToken, chatId) => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: '🔔 Nova Pure Speed Gmail Notifier test message!\n\nIf you receive this, your Telegram integration is working correctly.',
        parse_mode: 'HTML'
      })
    })
    const data = await response.json();

    return data.ok
  } catch (error) {
    console.log('Telegram test error:', error)
    return false
  }
}
