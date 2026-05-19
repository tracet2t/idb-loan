export const invitationTemplate = (inviteUrl) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
    <h2 style="color: #2c3e50;">IDB Loan Management System</h2>
    <p>Hello,</p>
    <p>You have been invited to join the IDB Staff Portal. To get started, please set up your account password by clicking the button below:</p>
    <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: #ffffff; text-decoration: none; border-radius: 5px;">Set Up Password</a>
    <p style="margin-top: 20px; font-size: 12px; color: #7f8c8d;">This link will expire in 24 hours.</p>
  </div>
`;