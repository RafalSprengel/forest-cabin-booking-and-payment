import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';
import styles from './TopBar.module.css';
import { SITE_CONFIG } from '@/config/site';

export default function TopBar() {
    return (
        <div className={styles.container}>
            <div className={styles.inner}>
                <div className={styles.contactInfo}>
                    <a href={`tel:${SITE_CONFIG.phoneHref}`}>{SITE_CONFIG.phoneDisplay}</a>
                    <a href={`mailto:${SITE_CONFIG.email}`}>{SITE_CONFIG.email}</a>
                </div>
                <div className={styles.socialIcons}>
                    <a 
                        href={SITE_CONFIG.facebookUrl}
                        target="_blank" 
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                    >
                        <FontAwesomeIcon 
                            icon={faFacebook} 
                            style={{ width: '20px', height: '20px' }} 
                        />
                    </a>
                </div>
            </div>
        </div>
    );
}