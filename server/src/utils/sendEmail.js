import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, 
    },
  });

  // const mailOptions = {
  // from: '"IDB Portal" <no-reply@idb.lk>',
  // to: options.email,
  // subject: options.subject,
  // html: `
  //   <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
  //     <h2 style="color: #2e7d5e;">Welcome to IDB Portal</h2>
  //     <p>Please click the button below to set up your password:</p>
  //     <div style="margin: 30px 0;">
  //       <!-- FIX: Ensure this matches the key 'inviteUrl' sent from the controller -->
  //       <a href="${options.inviteUrl}" 
  //          style="background-color: #2e7d5e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">
  //         Activate My Account
  //       </a>
  //     </div>
  //     <p style="font-size: 10px;">Link: ${options.inviteUrl}</p>
  //   </div>
  // `,
  // };

  const mailOptions = {
  from: '"IDB Portal" <no-reply@idb.lk>',
  to: options.email,
  subject: options.subject,
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; padding: 0; border: 2px solid #2e7d5e; border-radius: 8px; overflow: hidden;">
      <!-- Header Banner -->
      <div style="background-color: #2e7d5e; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">IDB STAFF PORTAL</h1>
      </div>

      <!-- Main Body -->
      <div style="padding: 30px; background-color: #ffffff;">
        <h2 style="color: #333; margin-top: 0;">Account Activation</h2>
        <p style="color: #555; line-height: 1.6; font-size: 16px;">
          Welcome to the team! Your official staff account has been provisioned. To finalize your access and secure your account, please set up your password using the secure link below.
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${options.inviteUrl}" 
             style="background-color: #2e7d5e; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            Activate My Account
          </a>
        </div>

        <p style="color: #888; font-size: 13px; font-style: italic; border-top: 1px solid #eee; padding-top: 20px;">
          <strong>Security Note:</strong> This invitation link is personal to you and will expire in 24 hours. If you did not expect this email, please ignore it.
        </p>
      </div>

      <!-- Footer/Fallback -->
      <div style="background-color: #f9f9f9; padding: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="font-size: 12px; color: #777; margin: 0;">
          If the button above does not work, copy and paste the following URL into your browser:
        </p>
        <p style="font-size: 12px; color: #2e7d5e; word-break: break-all; margin-top: 10px;">
          ${options.inviteUrl}
        </p>
      </div>
    </div>
  `,
};

  await transporter.sendMail(mailOptions);
};

export default sendEmail;