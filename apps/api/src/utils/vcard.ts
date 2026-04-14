interface PhoneEntry {
  country_code: string;
  number: string;
  label?: string | null;
  is_primary?: boolean;
}

interface VCardData {
  full_name: string;
  designation: string;
  email: string;
  phone?: string | null;
  phone_numbers?: PhoneEntry[];
  website_url?: string | null;
  linkedin_url?: string | null;
  address?: string | null;
  social_links?: { platform: string; url: string }[];
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
    `ORG:Intelligaia Technologies Pvt. Ltd.`,
    `TITLE:${data.designation}`,
  ];

  // Add phone numbers from phone_numbers table
  if (data.phone_numbers && data.phone_numbers.length > 0) {
    data.phone_numbers.forEach((pn) => {
      const fullNumber = `${pn.country_code}${pn.number}`;
      const label = pn.label ? ` (${pn.label})` : "";
      if (pn.is_primary) {
        lines.push(`TEL;TYPE=CELL,PREF:${fullNumber}`);
      } else {
        lines.push(`TEL;TYPE=CELL:${fullNumber}`);
      }
    });
  } else if (data.phone) {
    // Fallback to legacy phone field
    lines.push(`TEL;TYPE=CELL:${data.phone}`);
  }

  lines.push(`EMAIL;TYPE=WORK:${data.email}`);

  if (data.website_url) {
    lines.push(`URL:${data.website_url}`);
  }

  if (data.linkedin_url) {
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${data.linkedin_url}`);
  }

  // Add social profiles
  if (data.social_links) {
    data.social_links.forEach((link) => {
      const type = link.platform.toLowerCase().replace(/[^a-z]/g, "");
      if (type === "whatsapp") {
        const digits = link.url.replace(/[^0-9+]/g, "");
        lines.push(`TEL;TYPE=CELL:${digits}`);
      } else {
        lines.push(`X-SOCIALPROFILE;TYPE=${type}:${link.url}`);
      }
    });
  }

  if (data.address) {
    lines.push(`ADR;TYPE=WORK:;;${data.address};;;;`);
  }

  lines.push("END:VCARD");

  return lines.join("\r\n");
}
