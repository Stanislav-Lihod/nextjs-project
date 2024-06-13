'use server';

import {sql} from "@vercel/postgres";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {signIn} from "@/auth";
import {AuthError} from "next-auth";

export async function createInvoice(formData: FormData) {
  const rawFormData = {
    customerId: String(formData.get('customerId')),
    amount: Number(formData.get('amount')),
    status: String(formData.get('status')),
  };

  rawFormData.amount = rawFormData.amount * 100;
  const date = new Date().toISOString().split('T')[0];

  const{customerId, amount, status} = rawFormData

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amount}, ${status}, ${date})
    `;
  } catch (e){
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData){
  const rawFormData = {
    customerId: String(formData.get('customerId')),
    amount: Number(formData.get('amount')),
    status: String(formData.get('status')),
  };

  rawFormData.amount = rawFormData.amount * 100;

  const{customerId, amount, status} = rawFormData

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amount}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Update Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {

  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return { message: 'Deleted Invoice.' };
  } catch (e){
    return {
      message: 'Database Error: Failed to Delete Invoice.'
    }
  }
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}