'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faPhone } from '@fortawesome/free-solid-svg-icons';
import styles from './Contact.module.css';
import ContactForm from './ContactForm';
import { ISiteSettings } from '@/db/models/SiteSettings';
import { SlideLeft, SlideRight } from '@components/UI/Motions/Motions';

export default function Contact({ siteSettings }: { siteSettings: Partial<ISiteSettings> }) {
  const lat = 54.157354;
  const lng = 18.241247;


  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <section id="contact" className={styles.section}>
      <div className={styles.container}>
        <SlideRight>
          <h1 className={styles.title}>Kontakt</h1>
        </SlideRight>
        <div className={styles.flexWrapper}>
          <div className={styles.infoColumn}>
            <SlideLeft>
              <div className={styles.details}>
              <div className={styles.companyName}>Wilcze Chatki</div>
             
                <div>83-424 Szumleś Królewski 9A</div>
                <div>Kaszuby, woj. pomorskie</div>
                 <a 
                href={mapsUrl}
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.addressLink}
              >
                <div className={styles.mapHintWrapper}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} className={styles.mapIcon} />
                  <span className={styles.mapHint}>Kliknij, aby otworzyć mapę</span>
                </div>
              </a>

              <div className={styles.contactItem}>
                <FontAwesomeIcon icon={faPhone} className={styles.detailIcon} />
                <span><a href={`tel:${siteSettings.phoneHref}`} className={styles.contactLink}>{siteSettings.phoneDisplay}</a></span>
              </div>
              
              {/* <p className={styles.contactItem}>
                <FontAwesomeIcon icon={faEnvelope} className={styles.detailIcon} />
                <span>e-mail: <a href="mailto:kontakt@wilczechatki.pl" className={styles.contactLink}>kontakt@wilczechatki.pl</a></span>
              </p> */}
              </div>
            </SlideLeft>

            <SlideLeft delay={0.12}>
              <div className={styles.payment}>
                <div className={styles.paymentTitle} >Dane do przelewu:</div>
                <div>Numer konta PKO BP</div>
                <div className={styles.bankAccountNumber}>{siteSettings.bankAccountNumber}</div>
              </div>
            </SlideLeft>
          </div>

          <div className={styles.formColumn}>
            <SlideLeft delay={0.18}>
              <ContactForm />
            </SlideLeft>
          </div>
        </div>
      </div>
    </section>
  );
}