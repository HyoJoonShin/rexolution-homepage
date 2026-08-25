const RESEND_ENDPOINT = "https://api.resend.com/emails";
const MAX_FIELD_LENGTH = 4000;

function sanitize(value, maxLength = MAX_FIELD_LENGTH) {
  return String(value || "").trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return value.replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  })[character]);
}

function formatMultiline(value) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

function detailRow(label, value, multiline = false) {
  if (!value) return "";
  const content = multiline ? formatMultiline(value) : escapeHtml(value);
  return `<tr><th style="padding:8px 12px;text-align:left;background:#f4f4f5;vertical-align:top;">${label}</th><td style="padding:8px 12px;">${content}</td></tr>`;
}

module.exports = async (request, response) => {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_FROM_EMAIL || !process.env.CONTACT_TO_EMAIL) {
    return response.status(500).json({ error: "Mail service is not configured" });
  }

  const body = request.body || {};
  const lastName = sanitize(body.last_name, 100);
  const firstName = sanitize(body.first_name, 100);
  const company = sanitize(body.company, 200);
  const department = sanitize(body.department, 200);
  const position = sanitize(body.position, 200);
  const email = sanitize(body.user_email, 254);
  const phone = sanitize(body.phone, 40);
  const message = sanitize(body.message);
  const language = body.language === "en" ? "en" : "ko";
  const name = `${lastName}${firstName}`.trim();

  if (!name || !email || !message || !/^\S+@\S+\.\S+$/.test(email)) {
    return response.status(400).json({ error: "Invalid form data" });
  }

  const subjectPrefix = language === "en" ? "Website inquiry" : "홈페이지 문의";
  const html = `
    <h2>${subjectPrefix}</h2>
    <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;color:#222;">
      ${detailRow(language === "en" ? "Name" : "이름", name)}
      ${detailRow(language === "en" ? "Company" : "회사", company)}
      ${detailRow(language === "en" ? "Department" : "부서", department)}
      ${detailRow(language === "en" ? "Position" : "직책", position)}
      ${detailRow(language === "en" ? "Email" : "이메일", email)}
      ${detailRow(language === "en" ? "Phone" : "연락처", phone)}
      ${detailRow(language === "en" ? "Message" : "문의 내용", message, true)}
    </table>`;

  try {
    const resendResponse = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL,
        to: [process.env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject: `[${subjectPrefix}] ${company || name}`,
        html
      })
    });

    if (!resendResponse.ok) {
      console.error("Resend request failed", resendResponse.status);
      return response.status(502).json({ error: "Unable to send email" });
    }

    const result = await resendResponse.json();
    return response.status(200).json({ id: result.id });
  } catch (error) {
    console.error("Contact API failed", error);
    return response.status(500).json({ error: "Unable to send email" });
  }
};
