/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.text(); 
    console.log("Body requestu:", body); 

    if (!body) {
      return NextResponse.json({ message: 'Tělo požadavku je prázdné' }, { status: 400 });
    }

    const { to, subject, text } = JSON.parse(body); 

    if (!to || !subject || !text) {
      return NextResponse.json({ message: 'Chybí požadovaná data' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, 
      },
    });

    await transporter.sendMail({
      from: {
        name: 'GroupUp',
        address: 'miavecmates@gmail.com'
    },
      to,
      subject,
      text,
    });

    return NextResponse.json({ message: 'Email byl úspěšně odeslán' }, { status: 200 });
  } catch (error: any) {
    console.error("Chyba při odesílání emailu:", error); 
    return NextResponse.json({ message: 'Chyba při odesílání emailu', error: error.message }, { status: 500 });
  }
}



