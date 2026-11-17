/**
 * Pincode Lookup Utility for India
 * Uses India Post Public API with local caching and offline fallback for states
 */

export interface PincodeDetails {
    pincode: string;
    city: string;
    district: string;
    state: string;
}

// Local in-memory cache to prevent duplicate network calls
const pincodeCache = new Map<string, PincodeDetails>();

// State prefix mapping fallback for offline/instant resolution
function getStateByPrefix(pin: string): { state: string; defaultDistrict?: string } | null {
    if (!pin || pin.length < 2) return null;
    const prefix2 = pin.slice(0, 2);
    const prefix3 = pin.slice(0, 3);

    // North East
    if (prefix3 === '795') return { state: 'Manipur', defaultDistrict: 'Imphal' };
    if (prefix3 >= '781' && prefix3 <= '788') return { state: 'Assam', defaultDistrict: 'Kamrup' };
    if (prefix3 >= '793' && prefix3 <= '794') return { state: 'Meghalaya', defaultDistrict: 'East Khasi Hills' };
    if (prefix3 === '796') return { state: 'Mizoram', defaultDistrict: 'Aizawl' };
    if (prefix3 === '797') return { state: 'Nagaland', defaultDistrict: 'Kohima' };
    if (prefix3 === '799') return { state: 'Tripura', defaultDistrict: 'West Tripura' };
    if (prefix3 >= '790' && prefix3 <= '792') return { state: 'Arunachal Pradesh', defaultDistrict: 'Papum Pare' };
    if (prefix3 === '737') return { state: 'Sikkim', defaultDistrict: 'East Sikkim' };

    // Other Regions by 2-digit prefix
    switch (prefix2) {
        case '11': return { state: 'Delhi', defaultDistrict: 'New Delhi' };
        case '12':
        case '13': return { state: 'Haryana' };
        case '14':
        case '15':
        case '16': return { state: 'Punjab' };
        case '17': return { state: 'Himachal Pradesh' };
        case '18':
        case '19': return { state: 'Jammu and Kashmir' };
        case '20':
        case '21':
        case '22':
        case '23':
        case '24':
        case '25':
        case '26':
        case '27':
        case '28': return { state: 'Uttar Pradesh' };
        case '30':
        case '31':
        case '32':
        case '33':
        case '34': return { state: 'Rajasthan' };
        case '36':
        case '37':
        case '38':
        case '39': return { state: 'Gujarat' };
        case '40':
        case '41':
        case '42':
        case '43':
        case '44': return { state: 'Maharashtra' };
        case '45':
        case '46':
        case '47':
        case '48':
        case '49': return { state: 'Madhya Pradesh' };
        case '50':
        case '51':
        case '52':
        case '53': return { state: 'Andhra Pradesh' };
        case '56':
        case '57':
        case '58':
        case '59': return { state: 'Karnataka' };
        case '60':
        case '61':
        case '62':
        case '63':
        case '64': return { state: 'Tamil Nadu' };
        case '67':
        case '68':
        case '69': return { state: 'Kerala' };
        case '70':
        case '71':
        case '72':
        case '73':
        case '74': return { state: 'West Bengal' };
        case '75':
        case '76':
        case '77': return { state: 'Odisha' };
        case '80':
        case '81':
        case '82':
        case '83':
        case '84':
        case '85': return { state: 'Bihar' };
        default: return null;
    }
}

/**
 * Lookup Indian Pincode details from India Post API with offline fallback
 */
export async function lookupPincode(pincode: string): Promise<PincodeDetails | null> {
    const cleanPin = pincode.replace(/\D/g, '').trim();
    if (cleanPin.length !== 6) return null;

    if (pincodeCache.has(cleanPin)) {
        return pincodeCache.get(cleanPin)!;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice)) {
                const poList = data[0].PostOffice;
                if (poList.length > 0) {
                    const primary = poList[0];
                    const district = primary.District || '';
                    const state = primary.State || '';
                    const city = primary.Block && primary.Block !== 'NA' 
                        ? primary.Block 
                        : (primary.Division && primary.Division !== 'NA' ? primary.Division : primary.Name || district);

                    const result: PincodeDetails = {
                        pincode: cleanPin,
                        city,
                        district,
                        state
                    };
                    pincodeCache.set(cleanPin, result);
                    return result;
                }
            }
        }
    } catch {
        // Fallback to offline heuristic
    }

    // Offline prefix fallback
    const fallback = getStateByPrefix(cleanPin);
    if (fallback) {
        const result: PincodeDetails = {
            pincode: cleanPin,
            city: fallback.defaultDistrict || '',
            district: fallback.defaultDistrict || '',
            state: fallback.state
        };
        pincodeCache.set(cleanPin, result);
        return result;
    }

    return null;
}
