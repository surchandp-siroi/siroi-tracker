import { createWorker } from 'tesseract.js';

export interface ScannedIdData {
    documentType: 'AADHAAR' | 'PAN' | 'UNKNOWN';
    rawText: string;
    idNumber: string | null;
    fullName: string | null;
    dob: string | null; // formatted as YYYY-MM-DD or DD/MM/YYYY
    rawDob: string | null;
    gender?: string | null;
    fatherName?: string | null;
    confidence: number;
}

export interface DeviationItem {
    field: string;
    formValue: string;
    aadhaarValue: string;
    panValue: string;
    status: 'MATCH' | 'WARNING' | 'MISMATCH';
    message: string;
}

// Convert various date formats (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD) into YYYY-MM-DD
export function normalizeDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    const clean = dateStr.trim();

    // Check YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        return clean;
    }

    // Check DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (ddmmyyyy) {
        const day = ddmmyyyy[1].padStart(2, '0');
        const month = ddmmyyyy[2].padStart(2, '0');
        const year = ddmmyyyy[3];
        return `${year}-${month}-${day}`;
    }

    // Check Year only
    if (/^\d{4}$/.test(clean)) {
        return clean;
    }

    return clean;
}

// Format date nicely for humans: e.g. "15 Aug 1990" or "DD/MM/YYYY"
export function formatDisplayDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'Not Detected';
    const norm = normalizeDate(dateStr);
    if (!norm) return dateStr;
    if (/^\d{4}$/.test(norm)) return `Year ${norm}`;
    try {
        const parts = norm.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
    } catch {
        // fallback
    }
    return dateStr;
}

// Levenshtein distance implementation for typo / fuzzy comparison
export function levenshteinDistance(a: string, b: string): number {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0) return bn;
    if (bn === 0) return an;
    const matrix = [];
    for (let i = 0; i <= bn; ++i) matrix[i] = [i];
    for (let i = 0; i <= an; ++i) matrix[0][i] = i;
    for (let i = 1; i <= bn; ++i) {
        for (let j = 1; j <= an; ++j) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1) // insertion / deletion
                );
            }
        }
    }
    return matrix[bn][an];
}

// Clean and normalize name for comparison
export function cleanName(name: string | null | undefined): string {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/^(mr\.|mrs\.|ms\.|shri|smt|dr\.)\s+/i, '')
        .replace(/[^a-z\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Compare two names and return similarity (0 - 100) and analysis
export function compareNames(name1: string, name2: string): { similarity: number; isMatch: boolean; isWarning: boolean; reason: string } {
    const c1 = cleanName(name1);
    const c2 = cleanName(name2);

    if (!c1 || !c2) {
        return { similarity: 0, isMatch: false, isWarning: true, reason: 'One of the names is missing' };
    }

    if (c1 === c2) {
        return { similarity: 100, isMatch: true, isWarning: false, reason: 'Exact match' };
    }

    // Word set check (e.g. "Surchand Singh" vs "Singh Surchand")
    const words1 = c1.split(' ').sort();
    const words2 = c2.split(' ').sort();
    if (words1.join(' ') === words2.join(' ')) {
        return { similarity: 98, isMatch: true, isWarning: false, reason: 'Words match in different order' };
    }

    // Initial check (e.g. "R K Sharma" vs "Ramesh Kumar Sharma")
    const isInitialMatch = (words1.length > 1 && words2.length > 1) && words1.every(w1 => {
        return words2.some(w2 => w2 === w1 || (w1.length === 1 && w2.startsWith(w1)) || (w2.length === 1 && w1.startsWith(w2)));
    });

    if (isInitialMatch) {
        return { similarity: 85, isMatch: true, isWarning: true, reason: 'Matches with abbreviated initials' };
    }

    const maxLen = Math.max(c1.length, c2.length);
    const distance = levenshteinDistance(c1, c2);
    const similarity = Math.max(0, Math.round(((maxLen - distance) / maxLen) * 100));

    if (similarity >= 85) {
        return { similarity, isMatch: true, isWarning: true, reason: `Minor spelling variation (${similarity}% match)` };
    }

    return { similarity, isMatch: false, isWarning: false, reason: `Spelling mismatch (${similarity}% match)` };
}

// Compare two dates
export function compareDates(d1: string | null | undefined, d2: string | null | undefined): { isMatch: boolean; isWarning: boolean; reason: string } {
    if (!d1 || !d2) {
        return { isMatch: false, isWarning: true, reason: 'Date not detected on one of the documents' };
    }

    const n1 = normalizeDate(d1);
    const n2 = normalizeDate(d2);

    if (!n1 || !n2) {
        return { isMatch: false, isWarning: true, reason: 'Could not parse date' };
    }

    if (n1 === n2) {
        return { isMatch: true, isWarning: false, reason: 'Exact date match' };
    }

    // Year-only match check
    if (n1.length === 4 || n2.length === 4) {
        const y1 = n1.slice(0, 4);
        const y2 = n2.slice(0, 4);
        if (y1 === y2) {
            return { isMatch: true, isWarning: true, reason: 'Year of birth matches (Full DOB not available on card)' };
        }
        return { isMatch: false, isWarning: false, reason: `Birth year mismatch (${y1} vs ${y2})` };
    }

    return { isMatch: false, isWarning: false, reason: `DOB mismatch (${formatDisplayDate(d1)} vs ${formatDisplayDate(d2)})` };
}

// Extract Aadhaar details from OCR raw text
export function parseAadhaarText(rawText: string): Partial<ScannedIdData> {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    // 1. Aadhaar Number (12 digits with or without spaces)
    let idNumber: string | null = null;
    const aadhaarRegex = /\b([2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4})\b/g;
    const aadhaarMatches = rawText.match(aadhaarRegex);
    if (aadhaarMatches && aadhaarMatches.length > 0) {
        // Format as XXXX XXXX XXXX
        const cleanDigits = aadhaarMatches[0].replace(/\s+/g, '');
        if (cleanDigits.length === 12) {
            idNumber = `${cleanDigits.slice(0, 4)} ${cleanDigits.slice(4, 8)} ${cleanDigits.slice(8, 12)}`;
        }
    }

    // 2. Date of Birth / Year of Birth
    let dob: string | null = null;
    let rawDob: string | null = null;

    // Pattern: DOB: 12/05/1990 or DOB 12-05-1990 or Date of Birth: ...
    const dobMatch = rawText.match(/(?:DOB|Date\s*of\s*Birth|D\.O\.B\.?)[\s:]*([0-3]?[0-9][/-][0-1]?[0-9][/-][12][90]\d{2})/i);
    if (dobMatch) {
        rawDob = dobMatch[1];
        dob = normalizeDate(dobMatch[1]);
    } else {
        // Pattern: Year of Birth: 1985
        const yobMatch = rawText.match(/(?:Year\s*of\s*Birth|YOB)[\s:]*([12][90]\d{2})/i);
        if (yobMatch) {
            rawDob = yobMatch[1];
            dob = yobMatch[1];
        } else {
            // General date pattern in document
            const anyDate = rawText.match(/\b([0-3]?[0-9][/-][0-1]?[0-9][/-][12][90]\d{2})\b/);
            if (anyDate) {
                rawDob = anyDate[1];
                dob = normalizeDate(anyDate[1]);
            }
        }
    }

    // 3. Gender
    let gender: string | null = null;
    if (/\b(?:FEMALE|WOMAN)\b/i.test(rawText)) gender = 'Female';
    else if (/\b(?:MALE|MAN)\b/i.test(rawText)) gender = 'Male';
    else if (/\bTRANSGENDER\b/i.test(rawText)) gender = 'Transgender';

    // 4. Name Extraction
    // First attempt: Explicit label extraction (e.g. DigiLocker, e-Aadhaar, PDF downloads)
    let fullName: string | null = null;
    const nameLabelMatch = rawText.match(/(?:^|\n)\s*(?:Name|Cardholder(?:'s)?\s*Name|Customer(?:\s*Name)?)\s*[:\-]\s*([A-Za-z. ]{3,40})/i);
    if (nameLabelMatch) {
        fullName = nameLabelMatch[1].replace(/[^A-Za-z\s.]/g, '').trim();
    }

    const noiseKeywords = [
        'government', 'india', 'bharat', 'sarkar', 'uidai', 'unique', 'identification',
        'authority', 'enrolment', 'help', 'aadhaar', 'dob', 'male', 'female', 'yob',
        'address', 'father', 'mother', 'husband', 'card', 'mera', 'meri', 'pehchan',
        'powered', 'by', 'nsdl', 'utiitsl', 'protean', 'issued', 'download', 'valid',
        'digilocker', 'digi', 'locker', 'meripehchan', 'gender', 'satyameva', 'jayate'
    ];

    // Second attempt: On physical UIDAI cards, English name is located immediately above the DOB line
    if (!fullName) {
        // Find the index of the line containing DOB
        let dobLineIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (/DOB|Date\s*of\s*Birth|Year\s*of\s*Birth/i.test(lines[i])) {
                dobLineIndex = i;
                break;
            }
        }

        if (dobLineIndex > 0) {
            // Look at the lines above the DOB line for a valid name
            for (let i = dobLineIndex - 1; i >= 0; i--) {
                const line = lines[i].trim();
                const lower = line.toLowerCase();
                if (/^(powered(\s+by)?|digilocker)\b/i.test(line) || lower.includes('powered by') || lower.includes('digilocker')) continue;
                const hasNoise = noiseKeywords.some(kw => lower.includes(kw));
                const cleaned = line.replace(/^(name|customer\s*name)\s*[:\-]\s*/i, '').trim();
                const isAlphaOnly = /^[A-Za-z\s.]{3,35}$/.test(cleaned);

                if (!hasNoise && isAlphaOnly && cleaned.split(/\s+/).length >= 1) {
                    const words = cleaned.split(/\s+/).filter(w => w.replace(/[^a-zA-Z]/g, '').length >= 2);
                    if (words.length > 0) {
                        fullName = cleaned.replace(/[^A-Za-z\s.]/g, '').trim();
                        break;
                    }
                }
            }
        }
    }

    // Third attempt: Fallback name search if not found above DOB
    if (!fullName) {
        for (const line of lines) {
            const trimmed = line.trim();
            const lower = trimmed.toLowerCase();
            if (/^(powered(\s+by)?|digilocker)\b/i.test(trimmed) || lower.includes('powered by') || lower.includes('digilocker')) continue;
            const hasNoise = noiseKeywords.some(kw => lower.includes(kw));
            const cleaned = trimmed.replace(/^(name|customer\s*name)\s*[:\-]\s*/i, '').trim();
            const isAlphaOnly = /^[A-Za-z\s.]{4,30}$/.test(cleaned);
            if (!hasNoise && isAlphaOnly) {
                const words = cleaned.split(/\s+/).filter(w => w.replace(/[^a-zA-Z]/g, '').length >= 2);
                if (words.length >= 2) {
                    fullName = cleaned.replace(/[^A-Za-z\s.]/g, '').trim();
                    break;
                }
            }
        }
    }

    return {
        documentType: 'AADHAAR',
        idNumber,
        fullName,
        dob,
        rawDob,
        gender
    };
}

// Extract PAN details from OCR raw text
export function parsePanText(rawText: string): Partial<ScannedIdData> {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    // 1. PAN Number (5 letters, 4 digits, 1 letter)
    let idNumber: string | null = null;
    const panRegex = /\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/g;
    const panMatches = rawText.toUpperCase().match(panRegex);
    if (panMatches && panMatches.length > 0) {
        idNumber = panMatches[0];
    }

    // 2. Date of Birth
    let dob: string | null = null;
    let rawDob: string | null = null;
    const dobMatch = rawText.match(/(?:DOB|Date\s*of\s*Birth|D\.O\.B\.?)[\s:]*([0-3]?[0-9][/-][0-1]?[0-9][/-][12][90]\d{2})/i)
                  || rawText.match(/\b([0-3]?[0-9][/-][0-1]?[0-9][/-][12][90]\d{2})\b/);
    if (dobMatch) {
        rawDob = dobMatch[1];
        dob = normalizeDate(dobMatch[1]);
    }

    // 3. Name & Father's Name Extraction
    let fullName: string | null = null;
    let fatherName: string | null = null;

    // TIER 1: Explicit Labeled Extraction (e.g. DigiLocker, e-PAN, PDFs)
    const nameLabelMatch = rawText.match(/(?:^|\n)\s*(?:Name|Cardholder(?:'s)?\s*Name|Customer(?:\s*Name)?)\s*[:\-]\s*([A-Za-z. ]{3,40})/i);
    if (nameLabelMatch) {
        fullName = nameLabelMatch[1].replace(/[^A-Za-z\s.]/g, '').trim();
    }

    const fatherLabelMatch = rawText.match(/(?:^|\n)\s*(?:Father(?:'s)?(?:\s*Name)?)\s*[:\-]\s*([A-Za-z. ]{3,40})/i);
    if (fatherLabelMatch) {
        fatherName = fatherLabelMatch[1].replace(/[^A-Za-z\s.]/g, '').trim();
    }

    // TIER 2: Positional & Line Analysis for Physical Laminated Cards (without "Name :" labels)
    if (!fullName) {
        const noiseKeywords = [
            'income', 'tax', 'department', 'govt', 'government', 'india', 'bharat', 'sarkar',
            'permanent', 'account', 'number', 'card', 'sign', 'signature', 'date', 'birth',
            'holder', 'seal', 'reprint', 'issued', 'download', 'qr', 'scan', 'utiitsl',
            'nsdl', 'protean', 'directorate', 'powered', 'by', 'valid', 'only', 'electronic',
            'incometax', 'online', 'portal', 'digilocker', 'digi', 'locker', 'meripehchan',
            'satyameva', 'jayate', 'gender', 'male', 'female', 'transgender'
        ];

        const candidateLines: string[] = [];
        for (const line of lines) {
            const cleanLine = line.trim();
            const lower = cleanLine.toLowerCase();

            // Reject watermarks and system attribution lines
            if (/^(powered(\s+by)?|digilocker|digi\s*locker)\b/i.test(cleanLine) || lower.includes('powered by') || lower.includes('digilocker')) {
                continue;
            }

            const hasNoise = noiseKeywords.some(kw => lower.includes(kw));
            if (hasNoise) continue;

            // Strip any leftover label prefixes if present
            const strippedLine = cleanLine.replace(/^(name|cardholder\s*name|father'?s?\s*name)\s*[:\-]\s*/i, '').trim();

            const isAlpha = /^[A-Za-z. ]{3,40}$/.test(strippedLine);
            if (isAlpha && strippedLine.length >= 3) {
                const words = strippedLine.split(/\s+/).filter(w => w.replace(/[^a-zA-Z]/g, '').length >= 2);
                if (words.length >= 1) {
                    if (words.length === 1 && strippedLine.length < 4) continue;
                    candidateLines.push(strippedLine.replace(/[^A-Za-z\s.]/g, '').trim());
                }
            }
        }

        if (candidateLines.length > 0) {
            fullName = candidateLines[0];
        }
        if (candidateLines.length > 1 && !fatherName) {
            fatherName = candidateLines[1];
        }
    }

    return {
        documentType: 'PAN',
        idNumber,
        fullName,
        dob,
        rawDob,
        fatherName
    };
}

// Main OCR Scan Function using Tesseract.js Worker
export async function scanIdentityDocument(
    file: File, 
    expectedType: 'AADHAAR' | 'PAN',
    onProgress?: (progress: number, status: string) => void
): Promise<ScannedIdData> {
    onProgress?.(10, 'Initializing OCR engine...');

    const worker = await createWorker('eng');

    try {
        onProgress?.(30, `Scanning ${expectedType === 'AADHAAR' ? 'Aadhaar Card' : 'PAN Card'}...`);

        const result = await worker.recognize(file);
        const text = result.data.text || '';
        const confidence = result.data.confidence || 0;

        onProgress?.(80, 'Analyzing extracted text and signatures...');

        let parsedData: Partial<ScannedIdData> = {};
        if (expectedType === 'AADHAAR') {
            parsedData = parseAadhaarText(text);
        } else {
            parsedData = parsePanText(text);
        }

        onProgress?.(100, 'Scan completed!');

        return {
            documentType: expectedType,
            rawText: text,
            idNumber: parsedData.idNumber || null,
            fullName: parsedData.fullName || null,
            dob: parsedData.dob || null,
            rawDob: parsedData.rawDob || null,
            gender: parsedData.gender || null,
            fatherName: parsedData.fatherName || null,
            confidence
        };
    } finally {
        await worker.terminate();
    }
}
