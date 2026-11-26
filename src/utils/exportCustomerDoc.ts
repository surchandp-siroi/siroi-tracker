import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    ShadingType,
    AlignmentType
} from 'docx';

export interface CustomerExportData {
    customerName: string;
    panNumber: string;
    aadharNumber?: string;
    customerType: string;
    category?: string;
    product: string;
    amount: string | number;
    associationDate?: string;
    entryLocation?: string;
    staffName?: string;
    consultantName?: string;
    managerName?: string;
    channelPartner?: string;
    trackingNumber?: string;

    // Contact
    phoneNumber: string;
    emailId?: string;

    // Personal & Family
    birthday?: string;
    anniversary?: string;
    gender?: string;
    fatherName?: string;
    motherName?: string;
    maritalStatus?: string;
    spouseName?: string;
    educationQualification?: string;

    // Current Residence
    address: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    currentAddressLandmark?: string;
    residenceType?: string;
    yearsInCurrentResidence?: string;
    yearsInCurrentCity?: string;

    // Permanent Residence
    isSameAsCurrentAddress?: boolean;
    permanentStreet?: string;
    permanentCity?: string;
    permanentDistrict?: string;
    permanentState?: string;
    permanentPincode?: string;
    permanentAddress?: string;
    permanentAddressLandmark?: string;
    permanentPhone?: string;

    // Employment
    incomeType?: string;
    incomeCategory?: string;
    companyName?: string;
    designation?: string;
    officialEmail?: string;
    officePhone?: string;
    officeAddress?: string;
    officeLandmark?: string;
    yearlyIncomeRange?: string;
    monthlySalary?: string | number;

    // Banking
    salaryBankName?: string;
    salaryAccountNumber?: string;

    // Loan specifics
    tenure?: string;
    ref1Name?: string;
    ref1Phone?: string;
    ref1Address?: string;
    ref1Relation?: string;
    ref2Name?: string;
    ref2Phone?: string;
    ref2Address?: string;
    ref2Relation?: string;

    // Eligibility calculations (if available)
    eligibilitySummary?: {
        isSkipped?: boolean;
        skipReason?: string;
        monthlySalary?: number;
        maxLoanAmount?: number;
        foirPercent?: number;
        netDisposableIncome?: number;
        interestRateAnnual?: number;
        tenureMonths?: number;
        existingEmiTotal?: number;
    };
}

const formatCurrency = (val?: string | number) => {
    if (!val) return '₹ 0';
    const num = typeof val === 'number' ? val : Number(val.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return String(val);
    return '₹ ' + num.toLocaleString('en-IN');
};

const cleanText = (val?: string | number | null, fallback = '—') => {
    if (val === null || val === undefined) return fallback;
    const str = String(val).trim();
    return str ? str : fallback;
};

/**
 * Builds standard 2-column or 4-column key-value rows for Word Document tables
 */
function createTableRow(label1: string, val1: string, label2?: string, val2?: string): TableRow {
    const borders = {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
    };

    if (label2 !== undefined && val2 !== undefined) {
        return new TableRow({
            children: [
                new TableCell({
                    width: { size: 22, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    borders,
                    children: [new Paragraph({ children: [new TextRun({ text: label1, bold: true, size: 18, color: '475569' })] })]
                }),
                new TableCell({
                    width: { size: 28, type: WidthType.PERCENTAGE },
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    borders,
                    children: [new Paragraph({ children: [new TextRun({ text: cleanText(val1), size: 18, color: '0F172A' })] })]
                }),
                new TableCell({
                    width: { size: 22, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    borders,
                    children: [new Paragraph({ children: [new TextRun({ text: label2, bold: true, size: 18, color: '475569' })] })]
                }),
                new TableCell({
                    width: { size: 28, type: WidthType.PERCENTAGE },
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    borders,
                    children: [new Paragraph({ children: [new TextRun({ text: cleanText(val2), size: 18, color: '0F172A' })] })]
                }),
            ]
        });
    }

    return new TableRow({
        children: [
            new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                borders,
                children: [new Paragraph({ children: [new TextRun({ text: label1, bold: true, size: 18, color: '475569' })] })]
            }),
            new TableCell({
                width: { size: 75, type: WidthType.PERCENTAGE },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                borders,
                children: [new Paragraph({ children: [new TextRun({ text: cleanText(val1), size: 18, color: '0F172A' })] })]
            })
        ]
    });
}

function createSectionHeader(title: string, iconNumber: string): Paragraph {
    return new Paragraph({
        spacing: { before: 240, after: 80 },
        children: [
            new TextRun({
                text: `${iconNumber}. ${title.toUpperCase()}`,
                bold: true,
                size: 20,
                color: '163B41' // Brand Dark Teal
            })
        ]
    });
}

/**
 * Generates and downloads a Word Document (.docx) representing the completed Customer Application.
 */
export async function exportCustomerDocx(data: CustomerExportData): Promise<void> {
    const isLoan = data.customerType === 'Loans' || data.customerType === 'Loan' || data.category === 'Loan';

    // 1. Current Full Address
    const currentFullAddress = [
        data.address,
        data.currentAddressLandmark ? `Near ${data.currentAddressLandmark}` : '',
        data.city,
        data.district,
        data.state,
        data.pincode ? `PIN: ${data.pincode}` : ''
    ].filter(Boolean).join(', ');

    // 2. Permanent Full Address
    const permanentFullAddress = data.isSameAsCurrentAddress
        ? `Same as Current Address (${currentFullAddress})`
        : [
            data.permanentAddress || data.permanentStreet,
            data.permanentAddressLandmark ? `Near ${data.permanentAddressLandmark}` : '',
            data.permanentCity,
            data.permanentDistrict,
            data.permanentState,
            data.permanentPincode ? `PIN: ${data.permanentPincode}` : ''
        ].filter(Boolean).join(', ');

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: 'Calibri',
                        size: 20,
                    }
                }
            }
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 720,    // 0.5 in
                            right: 720,
                            bottom: 720,
                            left: 720,
                        }
                    }
                },
                children: [
                    // --- HEADER BLOCK ---
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 60 },
                        children: [
                            new TextRun({
                                text: 'SIROI FINANCIAL SERVICES',
                                bold: true,
                                size: 30,
                                color: '163B41'
                            })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 140 },
                        children: [
                            new TextRun({
                                text: 'CUSTOMER APPLICATION & KYC PROFILE',
                                bold: true,
                                size: 20,
                                color: '475569'
                            })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                        children: [
                            new TextRun({
                                text: `Date: ${cleanText(data.associationDate, new Date().toLocaleDateString('en-IN'))}   |   Branch: ${cleanText(data.entryLocation)}   |   Ref/Tracking No: ${cleanText(data.trackingNumber, cleanText(data.panNumber))}`,
                                size: 16,
                                italics: true,
                                color: '64748B'
                            })
                        ]
                    }),

                    // --- SECTION 1: SOURCING & GOVERNANCE ---
                    createSectionHeader('Sourcing & Application Details', '1'),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            createTableRow('Applicant Full Name', data.customerName, 'Customer Type / Category', `${data.customerType || '—'} / ${data.category || '—'}`),
                            createTableRow('Applied Product', data.product, 'Requested Amount', formatCurrency(data.amount)),
                            createTableRow('Channel Partner (Bank/Lender)', data.channelPartner || '—', 'Tracking / Ref Number', data.trackingNumber || '—'),
                            createTableRow('Sourcing Partner / Consultant', data.consultantName || 'Direct Walk-in', 'Branch Manager', data.managerName || '—'),
                            createTableRow('Sourcing Branch Location', data.entryLocation || '—', 'Data Entered By', data.staffName || '—'),
                        ]
                    }),

                    // --- SECTION 2: PERSONAL & DEMOGRAPHIC PROFILE ---
                    createSectionHeader('Applicant Personal Profile', '2'),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            createTableRow('Permanent Account No (PAN)', (data.panNumber || '').toUpperCase(), 'Aadhaar Card Number', data.aadharNumber || '—'),
                            createTableRow('Mobile Phone Number', data.phoneNumber, 'Personal Email Address', data.emailId || '—'),
                            createTableRow('Date of Birth', data.birthday || '—', 'Gender', data.gender || '—'),
                            createTableRow('Marital Status', data.maritalStatus || '—', 'Spouse Name', data.spouseName || '—'),
                            createTableRow("Father's / Husband's Name", data.fatherName || '—', "Mother's Name", data.motherName || '—'),
                            createTableRow('Educational Qualification', data.educationQualification || '—', 'Anniversary Date', data.anniversary || '—'),
                        ]
                    }),

                    // --- SECTION 3: RESIDENTIAL ADDRESS ---
                    createSectionHeader('Residential Address Details', '3'),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            createTableRow('Current Street Address', data.address || '—'),
                            createTableRow('Current Landmark', data.currentAddressLandmark || '—', 'City / Town', data.city || '—'),
                            createTableRow('District & State', `${data.district || '—'}, ${data.state || '—'}`, 'Pincode', data.pincode || '—'),
                            createTableRow('Residence Status', data.residenceType || '—', 'Years at Current Residence', data.yearsInCurrentResidence || '—'),
                            createTableRow('Permanent Full Address', permanentFullAddress || '—'),
                            createTableRow('Permanent Address Landmark', data.permanentAddressLandmark || '—', 'Permanent Contact Phone', data.permanentPhone || data.phoneNumber || '—')
                        ]
                    }),

                    // --- SECTION 4: EMPLOYMENT & INCOME PROFILE ---
                    createSectionHeader('Employment & Professional Profile', '4'),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            createTableRow('Income Category / Type', `${data.incomeCategory || '—'} (${data.incomeType || '—'})`, 'Employer / Business Name', data.companyName || '—'),
                            createTableRow('Designation / Role', data.designation || '—', 'Monthly Income / Salary', formatCurrency(data.monthlySalary || 0)),
                            createTableRow('Official Email ID', data.officialEmail || '—', 'Office Contact Phone', data.officePhone || '—'),
                            createTableRow('Office / Business Address', data.officeAddress || '—', 'Office Landmark', data.officeLandmark || '—'),
                            createTableRow('Annual Turnover / Range', data.yearlyIncomeRange || '—', 'Preferred Loan Tenure', data.tenure ? `${data.tenure} Months` : '—'),
                        ]
                    }),

                    // --- SECTION 5: BANKING & REFERENCES ---
                    createSectionHeader('Banking & References', '5'),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            createTableRow('Salary / Primary Bank', data.salaryBankName || '—', 'Bank Account Number', data.salaryAccountNumber || '—'),
                            createTableRow('Reference 1 (Name & Relation)', `${data.ref1Name || '—'} (${data.ref1Relation || '—'})`, 'Reference 1 Phone', data.ref1Phone || '—'),
                            createTableRow('Reference 1 Address', data.ref1Address || '—'),
                            createTableRow('Reference 2 (Name & Relation)', `${data.ref2Name || '—'} (${data.ref2Relation || '—'})`, 'Reference 2 Phone', data.ref2Phone || '—'),
                            createTableRow('Reference 2 Address', data.ref2Address || '—'),
                        ]
                    }),

                    // --- SECTION 6: LOAN ELIGIBILITY ASSESSMENT (IF LOAN) ---
                    ...(isLoan ? [
                        createSectionHeader('Loan Assessment & Eligibility Summary', '6'),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                ...(data.eligibilitySummary?.isSkipped ? [
                                    createTableRow('Eligibility Engine Status', 'SKIPPED / DEFERRED FOR CUSTOM REVIEW'),
                                    createTableRow('Reason for Skipping Eligibility', data.eligibilitySummary.skipReason || 'Non-salaried profile / manual underwriting requested.')
                                ] : [
                                    createTableRow('Evaluated Monthly Salary', formatCurrency(data.eligibilitySummary?.monthlySalary || data.monthlySalary || 0), 'Calculated Max Eligibility', formatCurrency(data.eligibilitySummary?.maxLoanAmount || 0)),
                                    createTableRow('Total Existing Monthly EMIs', formatCurrency(data.eligibilitySummary?.existingEmiTotal || 0), 'Net Disposable Income', formatCurrency(data.eligibilitySummary?.netDisposableIncome || 0)),
                                    createTableRow('Applicable Interest Rate (p.a.)', data.eligibilitySummary?.interestRateAnnual ? `${data.eligibilitySummary.interestRateAnnual}%` : '—', 'Evaluated Loan Tenure', data.eligibilitySummary?.tenureMonths ? `${data.eligibilitySummary.tenureMonths} Months` : (data.tenure ? `${data.tenure} Months` : '—'))
                                ])
                            ]
                        })
                    ] : []),

                    // --- DECLARATION & SIGNATURES ---
                    new Paragraph({
                        spacing: { before: 260, after: 100 },
                        children: [
                            new TextRun({
                                text: 'DECLARATION & UNDERTAKING',
                                bold: true,
                                size: 18,
                                color: '163B41'
                            })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 200 },
                        children: [
                            new TextRun({
                                text: 'I hereby declare that all the particulars and information given in this application form are true, correct, and complete to the best of my knowledge and belief. I authorize Siroi Financial Services and its lending partners to verify any information provided herein and retrieve bureau records as applicable for loan processing.',
                                size: 16,
                                italics: true,
                                color: '475569'
                            })
                        ]
                    }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 50, type: WidthType.PERCENTAGE },
                                        margins: { top: 300, bottom: 200, left: 160, right: 160 },
                                        borders: {
                                            top: { style: BorderStyle.DASHED, size: 1, color: '94A3B8' },
                                            bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                                            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                                            right: { style: BorderStyle.NONE, size: 0, color: 'auto' }
                                        },
                                        children: [
                                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Signature of Applicant', bold: true, size: 18, color: '1E293B' })] }),
                                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `(${data.customerName || 'Applicant'})`, size: 16, color: '64748B' })] }),
                                            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60 }, children: [new TextRun({ text: 'Date: ____________________   Place: ____________________', size: 14, color: '64748B' })] })
                                        ]
                                    }),
                                    new TableCell({
                                        width: { size: 50, type: WidthType.PERCENTAGE },
                                        margins: { top: 300, bottom: 200, left: 160, right: 160 },
                                        borders: {
                                            top: { style: BorderStyle.DASHED, size: 1, color: '94A3B8' },
                                            bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                                            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                                            right: { style: BorderStyle.NONE, size: 0, color: 'auto' }
                                        },
                                        children: [
                                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Authorized Sourcing Officer / Verification', bold: true, size: 18, color: '1E293B' })] }),
                                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `(${data.staffName || 'Staff Member'}, ${data.entryLocation || 'Siroi Branch'})`, size: 16, color: '64748B' })] }),
                                            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60 }, children: [new TextRun({ text: 'Branch Seal & Date: ____________________', size: 14, color: '64748B' })] })
                                        ]
                                    }),
                                ]
                            })
                        ]
                    })
                ]
            }
        ]
    });

    const blob = await Packer.toBlob(doc);
    const safeName = (data.customerName || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safePan = (data.panNumber || 'NA').toUpperCase().replace(/[^a-zA-Z0-9]/g, '');
    const fileName = `Siroi_Application_${safeName}_${safePan}.docx`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Builds HTML representation and invokes client-side print dialog for PDF saving.
 */
export function exportCustomerPdf(data: CustomerExportData): void {
    const isLoan = data.customerType === 'Loans' || data.customerType === 'Loan' || data.category === 'Loan';

    // Current Full Address
    const currentFullAddress = [
        data.address,
        data.currentAddressLandmark ? `Near ${data.currentAddressLandmark}` : '',
        data.city,
        data.district,
        data.state,
        data.pincode ? `PIN: ${data.pincode}` : ''
    ].filter(Boolean).join(', ');

    // Permanent Full Address
    const permanentFullAddress = data.isSameAsCurrentAddress
        ? `Same as Current Address (${currentFullAddress})`
        : [
            data.permanentAddress || data.permanentStreet,
            data.permanentAddressLandmark ? `Near ${data.permanentAddressLandmark}` : '',
            data.permanentCity,
            data.permanentDistrict,
            data.permanentState,
            data.permanentPincode ? `PIN: ${data.permanentPincode}` : ''
        ].filter(Boolean).join(', ');

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Customer Application - ${cleanText(data.customerName)} (${cleanText(data.panNumber)})</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm 15mm 15mm 15mm;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.4;
            background: #ffffff;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #163b41;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }
        .header h1 {
            margin: 0 0 2px 0;
            font-size: 22px;
            font-weight: 800;
            color: #163b41;
            letter-spacing: 0.5px;
        }
        .header h2 {
            margin: 0 0 4px 0;
            font-size: 13px;
            font-weight: 700;
            color: #475569;
            letter-spacing: 1px;
        }
        .header .meta {
            font-size: 10px;
            color: #64748b;
        }
        .section-title {
            background: #163b41;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 8px;
            margin-top: 10px;
            margin-bottom: 4px;
            border-radius: 3px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
            font-size: 10.5px;
        }
        th, td {
            border: 1px solid #cbd5e1;
            padding: 4px 7px;
            text-align: left;
            vertical-align: top;
        }
        .lbl {
            background-color: #f8fafc;
            font-weight: 600;
            color: #475569;
            width: 22%;
        }
        .val {
            color: #0f172a;
            width: 28%;
            word-break: break-word;
        }
        .full-lbl {
            background-color: #f8fafc;
            font-weight: 600;
            color: #475569;
            width: 22%;
        }
        .full-val {
            color: #0f172a;
            width: 78%;
            word-break: break-word;
        }
        .highlight {
            font-weight: 700;
            color: #163b41;
        }
        .declaration {
            margin-top: 10px;
            padding: 8px;
            background: #f8fafc;
            border: 1px dashed #94a3b8;
            border-radius: 4px;
            font-size: 9.5px;
            color: #475569;
            line-height: 1.35;
        }
        .signatures {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
        }
        .sig-block {
            width: 45%;
            text-align: center;
            border-top: 1px dashed #64748b;
            padding-top: 6px;
            font-size: 10px;
        }
        .sig-block strong {
            display: block;
            color: #0f172a;
            margin-bottom: 2px;
        }
        .sig-block span {
            color: #64748b;
            font-size: 9px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>SIROI FINANCIAL SERVICES</h1>
        <h2>CUSTOMER APPLICATION & KYC PROFILE</h2>
        <div class="meta">
            Date: <strong>${cleanText(data.associationDate, new Date().toLocaleDateString('en-IN'))}</strong> &nbsp;|&nbsp; 
            Branch: <strong>${cleanText(data.entryLocation)}</strong> &nbsp;|&nbsp; 
            Ref/Tracking No: <strong>${cleanText(data.trackingNumber, cleanText(data.panNumber))}</strong>
        </div>
    </div>

    <!-- 1. SOURCING & APPLICATION -->
    <div class="section-title">1. Sourcing & Application Details</div>
    <table>
        <tr>
            <td class="lbl">Applicant Full Name</td>
            <td class="val highlight">${cleanText(data.customerName)}</td>
            <td class="lbl">Customer Type / Category</td>
            <td class="val">${cleanText(data.customerType)} / ${cleanText(data.category)}</td>
        </tr>
        <tr>
            <td class="lbl">Applied Product</td>
            <td class="val">${cleanText(data.product)}</td>
            <td class="lbl">Requested Amount</td>
            <td class="val highlight">${formatCurrency(data.amount)}</td>
        </tr>
        <tr>
            <td class="lbl">Channel Partner (Bank)</td>
            <td class="val">${cleanText(data.channelPartner)}</td>
            <td class="lbl">Tracking / Ref No.</td>
            <td class="val">${cleanText(data.trackingNumber)}</td>
        </tr>
        <tr>
            <td class="lbl">Sourcing Partner / Consultant</td>
            <td class="val">${cleanText(data.consultantName, 'Direct Walk-in')}</td>
            <td class="lbl">Reporting Manager</td>
            <td class="val">${cleanText(data.managerName)}</td>
        </tr>
        <tr>
            <td class="lbl">Sourcing Branch Location</td>
            <td class="val">${cleanText(data.entryLocation)}</td>
            <td class="lbl">Data Entered By</td>
            <td class="val">${cleanText(data.staffName)}</td>
        </tr>
    </table>

    <!-- 2. PERSONAL & DEMOGRAPHIC PROFILE -->
    <div class="section-title">2. Applicant Personal Profile</div>
    <table>
        <tr>
            <td class="lbl">Permanent Account No (PAN)</td>
            <td class="val highlight">${cleanText(data.panNumber).toUpperCase()}</td>
            <td class="lbl">Aadhaar Number</td>
            <td class="val">${cleanText(data.aadharNumber)}</td>
        </tr>
        <tr>
            <td class="lbl">Mobile Phone Number</td>
            <td class="val">${cleanText(data.phoneNumber)}</td>
            <td class="lbl">Email Address</td>
            <td class="val">${cleanText(data.emailId)}</td>
        </tr>
        <tr>
            <td class="lbl">Date of Birth</td>
            <td class="val">${cleanText(data.birthday)}</td>
            <td class="lbl">Gender / Marital Status</td>
            <td class="val">${cleanText(data.gender)} / ${cleanText(data.maritalStatus)}</td>
        </tr>
        <tr>
            <td class="lbl">Father's / Husband's Name</td>
            <td class="val">${cleanText(data.fatherName)}</td>
            <td class="lbl">Mother's Name</td>
            <td class="val">${cleanText(data.motherName)}</td>
        </tr>
        <tr>
            <td class="lbl">Spouse Name</td>
            <td class="val">${cleanText(data.spouseName)}</td>
            <td class="lbl">Education Qualification</td>
            <td class="val">${cleanText(data.educationQualification)}</td>
        </tr>
    </table>

    <!-- 3. RESIDENTIAL ADDRESS -->
    <div class="section-title">3. Residential Address Details</div>
    <table>
        <tr>
            <td class="full-lbl">Current Street Address</td>
            <td class="full-val">${cleanText(data.address)}</td>
        </tr>
        <tr>
            <td class="lbl">Current Landmark</td>
            <td class="val">${cleanText(data.currentAddressLandmark)}</td>
            <td class="lbl">City / Town</td>
            <td class="val">${cleanText(data.city)}</td>
        </tr>
        <tr>
            <td class="lbl">District & State</td>
            <td class="val">${cleanText(data.district)}, ${cleanText(data.state)}</td>
            <td class="lbl">Pincode</td>
            <td class="val">${cleanText(data.pincode)}</td>
        </tr>
        <tr>
            <td class="lbl">Residence Ownership</td>
            <td class="val">${cleanText(data.residenceType)}</td>
            <td class="lbl">Years in Current Residence</td>
            <td class="val">${cleanText(data.yearsInCurrentResidence)}</td>
        </tr>
        <tr>
            <td class="full-lbl">Permanent Full Address</td>
            <td class="full-val">${cleanText(permanentFullAddress)}</td>
        </tr>
        <tr>
            <td class="lbl">Permanent Landmark</td>
            <td class="val">${cleanText(data.permanentAddressLandmark)}</td>
            <td class="lbl">Permanent Phone</td>
            <td class="val">${cleanText(data.permanentPhone, data.phoneNumber)}</td>
        </tr>
    </table>

    <!-- 4. EMPLOYMENT & PROFESSIONAL PROFILE -->
    <div class="section-title">4. Employment & Professional Profile</div>
    <table>
        <tr>
            <td class="lbl">Income Profile Type</td>
            <td class="val">${cleanText(data.incomeCategory)} (${cleanText(data.incomeType)})</td>
            <td class="lbl">Employer / Business Name</td>
            <td class="val highlight">${cleanText(data.companyName)}</td>
        </tr>
        <tr>
            <td class="lbl">Designation / Role</td>
            <td class="val">${cleanText(data.designation)}</td>
            <td class="lbl">Monthly Salary / Income</td>
            <td class="val highlight">${formatCurrency(data.monthlySalary || 0)}</td>
        </tr>
        <tr>
            <td class="lbl">Official Email</td>
            <td class="val">${cleanText(data.officialEmail)}</td>
            <td class="lbl">Office Phone</td>
            <td class="val">${cleanText(data.officePhone)}</td>
        </tr>
        <tr>
            <td class="lbl">Office / Work Address</td>
            <td class="val">${cleanText(data.officeAddress)}</td>
            <td class="lbl">Office Landmark</td>
            <td class="val">${cleanText(data.officeLandmark)}</td>
        </tr>
        <tr>
            <td class="lbl">Annual Turnover / Range</td>
            <td class="val">${cleanText(data.yearlyIncomeRange)}</td>
            <td class="lbl">Preferred Tenure</td>
            <td class="val">${data.tenure ? `${data.tenure} Months` : '—'}</td>
        </tr>
    </table>

    <!-- 5. BANKING & REFERENCES -->
    <div class="section-title">5. Banking & References</div>
    <table>
        <tr>
            <td class="lbl">Salary / Primary Bank</td>
            <td class="val">${cleanText(data.salaryBankName)}</td>
            <td class="lbl">Bank Account Number</td>
            <td class="val">${cleanText(data.salaryAccountNumber)}</td>
        </tr>
        <tr>
            <td class="lbl">Reference 1 (Name & Relation)</td>
            <td class="val">${cleanText(data.ref1Name)} (${cleanText(data.ref1Relation)})</td>
            <td class="lbl">Reference 1 Phone</td>
            <td class="val">${cleanText(data.ref1Phone)}</td>
        </tr>
        <tr>
            <td class="full-lbl">Reference 1 Address</td>
            <td class="full-val">${cleanText(data.ref1Address)}</td>
        </tr>
        <tr>
            <td class="lbl">Reference 2 (Name & Relation)</td>
            <td class="val">${cleanText(data.ref2Name)} (${cleanText(data.ref2Relation)})</td>
            <td class="lbl">Reference 2 Phone</td>
            <td class="val">${cleanText(data.ref2Phone)}</td>
        </tr>
        <tr>
            <td class="full-lbl">Reference 2 Address</td>
            <td class="full-val">${cleanText(data.ref2Address)}</td>
        </tr>
    </table>

    <!-- 6. LOAN ASSESSMENT & ELIGIBILITY -->
    ${isLoan ? `
    <div class="section-title">6. Loan Assessment & Eligibility Summary</div>
    <table>
        ${data.eligibilitySummary?.isSkipped ? `
        <tr>
            <td class="full-lbl">Eligibility Assessment</td>
            <td class="full-val highlight" style="color: #d97706;">SKIPPED / DEFERRED FOR CUSTOM UNDERWRITING</td>
        </tr>
        <tr>
            <td class="full-lbl">Reason for Skipping</td>
            <td class="full-val">${cleanText(data.eligibilitySummary.skipReason, 'Non-salaried profile or manual underwriting required.')}</td>
        </tr>
        ` : `
        <tr>
            <td class="lbl">Evaluated Monthly Salary</td>
            <td class="val">${formatCurrency(data.eligibilitySummary?.monthlySalary || data.monthlySalary || 0)}</td>
            <td class="lbl">Calculated Max Eligibility</td>
            <td class="val highlight">${formatCurrency(data.eligibilitySummary?.maxLoanAmount || 0)}</td>
        </tr>
        <tr>
            <td class="lbl">Existing Monthly EMIs</td>
            <td class="val">${formatCurrency(data.eligibilitySummary?.existingEmiTotal || 0)}</td>
            <td class="lbl">Net Disposable Income</td>
            <td class="val">${formatCurrency(data.eligibilitySummary?.netDisposableIncome || 0)}</td>
        </tr>
        <tr>
            <td class="lbl">Interest Rate (p.a.)</td>
            <td class="val">${data.eligibilitySummary?.interestRateAnnual ? `${data.eligibilitySummary.interestRateAnnual}%` : '—'}</td>
            <td class="lbl">Evaluated Loan Tenure</td>
            <td class="val">${data.eligibilitySummary?.tenureMonths ? `${data.eligibilitySummary.tenureMonths} Months` : (data.tenure ? `${data.tenure} Months` : '—')}</td>
        </tr>
        `}
    </table>
    ` : ''}

    <div class="declaration">
        <strong>DECLARATION & UNDERTAKING:</strong> I hereby declare that all particulars and documentation provided in this application are true, accurate, and complete. I authorize Siroi Financial Services and its lending channel partners to verify any information and review credit bureau records as needed.
    </div>

    <div class="signatures">
        <div class="sig-block">
            <strong>Signature of Applicant</strong>
            <span>(${cleanText(data.customerName, 'Applicant')})</span>
            <div style="margin-top: 10px; font-size: 8.5px; color: #94a3b8;">Date & Place: ________________________</div>
        </div>
        <div class="sig-block">
            <strong>Authorized Sourcing Officer</strong>
            <span>(${cleanText(data.staffName, 'Staff Member')}, ${cleanText(data.entryLocation, 'Siroi')})</span>
            <div style="margin-top: 10px; font-size: 8.5px; color: #94a3b8;">Branch Seal & Date: ________________________</div>
        </div>
    </div>
</body>
</html>
    `;

    // Create an invisible iframe to execute the print action cleanly
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();

        setTimeout(() => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } catch (err) {
                console.error('Print failure:', err);
            } finally {
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                }, 3000);
            }
        }, 400);
    }
}
