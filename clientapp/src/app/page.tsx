import Image from 'next/image';
import styles from './Home.module.css';
import 'typeface-anton';

export default function Home() {
  return (
    <div>
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
          <p className={`${styles.subtext} ${styles.textAnimation}`}>
            One of a Kind crowdfunding and betting platform
          </p>
        </div>
      </div>
      <div id="roadmap" className={styles.roadmap}>
        <h2>Our Roadmap</h2>
        <div className={styles.timeline}>
          <div className={styles.milestone}>
            <div className={styles.milestoneContent}>
              <h3>Athlete Repository</h3>
              <p>Build a comprehensive repository of athletes.</p>
            </div>
          </div>
          <div className={styles.milestone}>
            <div className={styles.milestoneContent}>
              <h3>Athlete Tracking</h3>
              <p>Implement a system to track athlete progress and performance.</p>
            </div>
          </div>
          <div className={styles.milestone}>
            <div className={styles.milestoneContent}>
              <h3>Collaboration</h3>
              <p>Foster collaboration between athletes and brands.</p>
            </div>
          </div>
          <div className={styles.milestone}>
            <div className={styles.milestoneContent}>
              <h3>Brand Deals</h3>
              <p>Secure brand deals to support athletes financially.</p>
            </div>
          </div>
          <div className={styles.milestone}>
            <div className={styles.milestoneContent}>
              <h3>Equipment Tie-ups</h3>
              <p>Partner with equipment manufacturers for better gear.</p>
            </div>
          </div>
          <div className={styles.milestone}>
            <div className={styles.milestoneContent}>
              <h3>NFTs</h3>
              <p>Introduce NFTs for athletes and their supporters.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
