const fs = require('fs');
let content = fs.readFileSync('src/pages/ConsultantApprovalPage.tsx', 'utf-8');

const getFormattedBankNameStr = `
const getFormattedBankName = (bankName: string) => {
    if (!bankName) return bankName;
    const name = bankName.toLowerCase().trim();
    
    // Explicit overrides for common shorthand names and collisions
    if (name.includes('state bank') || name.includes('sbi')) return 'State Bank of India';
    if (name.includes('pnb') || name.includes('punjab national')) return 'Punjab National Bank';
    if (name.includes('hdfc')) return 'HDFC Bank';
    if (name.includes('icici')) return 'ICICI Bank';
    if (name.includes('axis')) return 'Axis Bank';
    if (name.includes('kotak')) return 'Kotak Mahindra Bank';
    if (name.includes('yes')) return 'Yes Bank';
    if (name.includes('canara')) return 'Canara Bank';
    if (name.includes('bank of baroda')) return 'Bank of Baroda';
    if (name.includes('union bank')) return 'Union Bank of India';
    if (name.includes('central bank')) return 'Central Bank of India';
    if (name.includes('maharashtra')) return 'Bank of Maharashtra';
    if (name === 'bank of india' || name.includes('bank of india')) return 'Bank of India';

    // Reverse lookup
    const sortedBanks = Object.entries(BANK_MAP).sort((a, b) => b[1].length - a[1].length);
    for (const [slug, fullName] of sortedBanks) {
        if (name.includes(fullName.toLowerCase()) || fullName.toLowerCase().includes(name)) {
            return fullName;
        }
    }
    
    // Fallback: Title Case
    return bankName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const getBankLogoUrl = (bankName: string) => {`;

content = content.replace('const getBankLogoUrl = (bankName: string) => {', getFormattedBankNameStr);

const handleActionOld = `    const handleAction = async (id: string, newStatus: 'approved' | 'rejected') => {
        setActionLoading(id);
        try {
            const { error } = await supabase
                .from('consultants')
                .update({ status: newStatus })
                .eq('id', id);
            
            if (error) throw error;
            
            // Remove from list
            setPendingConsultants(prev => prev.filter(c => c.id !== id));
            
            if (newStatus === 'approved') {
                const approvedConsultant = pendingConsultants.find(c => c.id === id);
                if (approvedConsultant) {
                    setApprovedConsultants(prev => [{ ...approvedConsultant, status: 'approved' }, ...prev]);
                    
                    // Trigger email notification
                    triggerNotification('onboarding_approved', {
                        email: approvedConsultant.email,
                        name: approvedConsultant.name
                    });
                }
            }
        } catch (error) {
            console.error(\`Error \${newStatus} consultant:\`, error);
            alert(\`Failed to \${newStatus} consultant. Please try again.\`);
        } finally {
            setActionLoading(null);
        }
    };`;

const handleActionNew = `    const handleAction = async (id: string, newStatus: 'approved' | 'rejected') => {
        setActionLoading(id);
        try {
            const consultantToUpdate = pendingConsultants.find(c => c.id === id);
            const finalBankName = newStatus === 'approved' && consultantToUpdate?.bank_name 
                ? getFormattedBankName(consultantToUpdate.bank_name)
                : consultantToUpdate?.bank_name;

            const { error } = await supabase
                .from('consultants')
                .update({ 
                    status: newStatus,
                    ...(newStatus === 'approved' ? { bank_name: finalBankName } : {})
                })
                .eq('id', id);
            
            if (error) throw error;
            
            // Remove from list
            setPendingConsultants(prev => prev.filter(c => c.id !== id));
            
            if (newStatus === 'approved') {
                if (consultantToUpdate) {
                    setApprovedConsultants(prev => [{ ...consultantToUpdate, status: 'approved', bank_name: finalBankName }, ...prev]);
                    
                    // Trigger email notification
                    triggerNotification('onboarding_approved', {
                        email: consultantToUpdate.email,
                        name: consultantToUpdate.name
                    });
                }
            }
        } catch (error) {
            console.error(\`Error \${newStatus} consultant:\`, error);
            alert(\`Failed to \${newStatus} consultant. Please try again.\`);
        } finally {
            setActionLoading(null);
        }
    };`;

content = content.replace(handleActionOld, handleActionNew);

fs.writeFileSync('src/pages/ConsultantApprovalPage.tsx', content, 'utf-8');
console.log('Fixed handleAction bank formatting');
