import express from 'express';
const router = express.Router();

// Simple test endpoint
router.get('/inbox', (req, res) => {
  console.log('📧 Email inbox endpoint called');
  
  const mockEmails = [
    {
      id: '1',
      from: { name: 'John Doe', email: 'john@example.com' },
      to: [{ name: 'Alygen', email: process.env.SENDER_EMAIL || 'contacto@alygen.com' }],
      subject: 'Inquiry about web development services',
      snippet: 'Hi, I\'m interested in your web development services...',
      html: '<p>Hi, I\'m interested in your web development services. Can you provide more information?</p>',
      text: 'Hi, I\'m interested in your web development services. Can you provide more information?',
      date: new Date().toISOString(),
      read: false,
      important: true
    },
    {
      id: '2',
      from: { name: 'Jane Smith', email: 'jane@company.com' },
      to: [{ name: 'Alygen', email: process.env.SENDER_EMAIL || 'contacto@alygen.com' }],
      subject: 'Website redesign project',
      snippet: 'We need to redesign our company website...',
      html: '<p>We need to redesign our company website. What are your rates?</p>',
      text: 'We need to redesign our company website. What are your rates?',
      date: new Date(Date.now() - 86400000).toISOString(),
      read: true,
      important: false
    },
    {
      id: '3',
      from: { name: 'Mike Johnson', email: 'mike@business.com' },
      to: [{ name: 'Alygen', email: process.env.SENDER_EMAIL || 'contacto@alygen.com' }],
      subject: 'SEO optimization quote needed',
      snippet: 'Looking for SEO services for our e-commerce site...',
      html: '<p>Looking for SEO services for our e-commerce site. Can you send us a quote?</p>',
      text: 'Looking for SEO services for our e-commerce site. Can you send us a quote?',
      date: new Date(Date.now() - 172800000).toISOString(),
      read: false,
      important: true
    }
  ];

  console.log(`✅ Sending ${mockEmails.length} mock emails`);
  res.json({ success: true, emails: mockEmails });
});

// Mark email as read
router.post('/:emailId/read', (req, res) => {
  console.log(`✅ Marking email ${req.params.emailId} as read`);
  res.json({ success: true });
});

// Delete email
router.delete('/:emailId', (req, res) => {
  console.log(`🗑️ Deleting email ${req.params.emailId}`);
  res.json({ success: true });
});

export default router;
