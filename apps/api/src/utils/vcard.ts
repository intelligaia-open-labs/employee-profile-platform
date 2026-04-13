interface VCardData {
  full_name: string;
  designation: string;
  email: string;
  phone: string;
  website_url?: string | null;
  linkedin_url?: string | null;
  address?: string | null;
}

export function generateVCard(data: VCardData): string {
  const nameParts = data.full_name.split(" ");
  const lastName = nameParts.pop() || "";
  const firstName = nameParts.join(" ") || "";

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${lastName};${firstName};;;`,
    `FN:${data.full_name}`,
    `TITLE:${data.designation}`,
    `TEL;TYPE=CELL:${data.phone}`,
    `EMAIL:${data.email}`,
  ];

  if (data.website_url) {
    lines.push(`URL:${data.website_url}`);
  }

  if (data.linkedin_url) {
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${data.linkedin_url}`);
  }

  if (data.address) {
    lines.push(`ADR;TYPE=WORK:;;${data.address};;;;`);
  }

  lines.push("END:VCARD");

  return lines.join("\r\n");
}
