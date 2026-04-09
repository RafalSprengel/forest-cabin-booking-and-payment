import styles from './Footer.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone } from '@fortawesome/free-solid-svg-icons';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';   
import Image from 'next/image';
import { SITE_CONFIG } from '@/config/site';

export default function Footer() {
  return (
    <footer className={styles.container}>
      <div className={styles.inner}>
        <div className={styles.info}>
          <Image 
            src="/assets/logo-round.png" 
            alt="Logo Wilcze Chatki" 
            width={100} 
            height={100} 
          />
          <h3>Wilcze Chatki</h3>
          <p>83-424 Szumleś Królewski 9A</p>
          <p>Kaszuby, woj. pomorskie</p>
          
          <div className={styles.contact}>
            <p>
              <FontAwesomeIcon icon={faPhone} color={'#c9b363'}/> 
              <a href={`tel:${SITE_CONFIG.phoneHref}`} className={styles.footerContactLink}>{SITE_CONFIG.phoneDisplay}</a>
            </p>
            {/* <p>
              <FontAwesomeIcon icon={faEnvelope} /> kontakt@wilczechatki.pl
            </p> 
            */}
          </div>
        </div>

        <div className={styles.social}>
          <a
            href={SITE_CONFIG.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className={styles.facebook}
          >
            <FontAwesomeIcon icon={faFacebook} />
          </a>
        </div>
      </div>

      <div className={styles.copyright}>
        <p>&copy; {new Date().getFullYear()} Wilcze Chatki. Wszelkie prawa zastrzeżone.</p>
        <div className={styles.creator}>
          Realizacja strony: 
          <a 
            href="https://rafalsprengel.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.creatorLink}
          >
            Rafał Sprengel
          </a>
        </div>
      </div>
    </footer>
  );
}