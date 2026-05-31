import styles from './GallerySection.module.css';
import LightBoxGallery from '@components/LightBoxGallery/LightBoxGallery';
import { SlideLeft, SlideRight } from '@components/UI/Motions/Motions';


export default function GallerySection() {

    const images = [
        { full: '/gallery/wnetrze1.webp', thumb: '/gallery/wnetrze1-thumb.webp', description: '' },
        { full: '/gallery/wnetrze2.webp', thumb: '/gallery/wnetrze2-thumb.webp', description: '' },
        { full: '/gallery/wnetrze3.webp', thumb: '/gallery/wnetrze3-thumb.webp', description: '' },
        { full: '/gallery/wnetrze4.webp', thumb: '/gallery/wnetrze4-thumb.webp', description: '' },
        { full: '/gallery/wnetrze5.webp', thumb: '/gallery/wnetrze5-thumb.webp', description: '' },
        { full: '/gallery/wnetrze6.webp', thumb: '/gallery/wnetrze6-thumb.webp', description: '' },
        { full: '/gallery/wnetrze7.webp', thumb: '/gallery/wnetrze7-thumb.webp', description: '' },
        { full: '/gallery/sypialnia1.webp', thumb: '/gallery/sypialnia1-thumb.webp', description: '' },
    ];

    return (
        <section id='gallery-section'>
            <div className={styles.title}>
                <SlideRight>
                    <h1>Galeria zdjęć</h1>
                </SlideRight>
            </div >
            <SlideLeft>
                <div className={styles.galleryWrap}>
                    <LightBoxGallery images={images} />
                </div>
            </SlideLeft>
            <a href="/gallery" className={styles.link}>Zobacz więcej &raquo;</a>
        </section >
    );
}