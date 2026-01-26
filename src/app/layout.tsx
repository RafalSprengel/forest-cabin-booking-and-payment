import { Playfair_Display, Inter } from "next/font/google";
import type { Metadata } from 'next';
import './globals.css';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';

import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
config.autoAddCss = false;

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
	title: 'Wilcze Chatki - Domki na Kaszubach',
	description: 'Komfortowe domki z sauną i jakuzzi w Szumlesiu Królewskim',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="pl">
			<body className={`${inter.variable} ${playfair.variable}`}>
				<Header />
				{children}
				<Footer />
			</body>
		</html>
	);
}