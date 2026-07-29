import { NextResponse } from 'next/server';
import { db } from '@lagchow/database';
import { vendors } from '@lagchow/database/src/schema';

// Helper to generate a URL-friendly slug
function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Required fields from the onboarding form
    const { name, email, phone, bankName, accountName, accountNumber, shopDetails } = data;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required.' },
        { status: 400 }
      );
    }

    const slug = generateSlug(name);
    
    // Construct the bankAccount JSON
    const bankAccount = {
      bankName: bankName || '',
      accountName: accountName || '',
      accountNumber: accountNumber || '',
      shopDetails: shopDetails || '',
    };

    // Insert vendor into DB
    const [newVendor] = await db
      .insert(vendors)
      .values({
        name,
        slug,
        email,
        phone,
        bankAccount,
        // Default required fields by schema
        coverImage: 'https://via.placeholder.com/600x400?text=Vendor',
        rating: '0',
        reviews: '0',
        deliveryTime: 'N/A',
        distance: 'N/A',
        deliveryFee: 'N/A',
        minOrder: 'N/A',
        status: 'pending_first_login', // Adhering to the strategy
      })
      .returning();

    return NextResponse.json({ vendor: newVendor }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return all vendors to display in the admin table
    const allVendors = await db.select().from(vendors);
    return NextResponse.json({ vendors: allVendors }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors', details: error.message },
      { status: 500 }
    );
  }
}
