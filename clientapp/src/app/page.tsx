// Home.jsx
import Image from 'next/image';
import styles from './Home.module.css';
// import '../globals.css';
import 'typeface-anton';

export default function Home() {
  return (
    <div className={styles.container}>
      <Image
        className={styles.image}
        src="/images/hero.gif"
        alt="hero-img"
        layout="fill"
        objectFit="cover"
      />
      <div className={styles.text}>
        <h1 className={`${styles.sportnet} ${styles.textAnimation}`}>SportNet</h1>
        <p className={`${styles.subtext} ${styles.textAnimation}`}>One of a Kind crowdfunding and betting platform</p>
      </div>
    </div>
  );
}
