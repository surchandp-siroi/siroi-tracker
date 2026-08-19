const fs = require('fs');
let content = fs.readFileSync('src/pages/ConsultantApprovalPage.tsx', 'utf-8');

const handleFormatOld = `    const handleEditSave = async (id: string, updates: Partial<Consultant>) => {`;
const handleFormatNew = `    const handleFormatAllBanks = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('consultants').select('*');
            if (error) throw error;
            
            let updated = 0;
            for (const c of data) {
                const newName = getFormattedBankName(c.bank_name);
                if (newName !== c.bank_name) {
                    await supabase.from('consultants').update({ bank_name: newName }).eq('id', c.id);
                    updated++;
                }
            }
            fetchPending();
            fetchApproved();
        } catch (e) {
            console.error(e);
            alert('Error formatting banks');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditSave = async (id: string, updates: Partial<Consultant>) => {`;

content = content.replace(handleFormatOld, handleFormatNew);

const buttonOld = `<div className="flex bg-slate-100/80 backdrop-blur-sm p-1 rounded-lg border border-slate-200">`;
const buttonNew = `<Button variant="outline" size="sm" onClick={handleFormatAllBanks} disabled={isLoading} className="mr-4">
                            Fix Existing Bank Names
                        </Button>
                        <div className="flex bg-slate-100/80 backdrop-blur-sm p-1 rounded-lg border border-slate-200">`;

content = content.replace(buttonOld, buttonNew);

fs.writeFileSync('src/pages/ConsultantApprovalPage.tsx', content, 'utf-8');
console.log('Injected format button');
