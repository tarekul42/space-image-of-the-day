import { ApodData } from '../types/apod';

/**
 * starterApods - A collection of 20 iconic NASA APOD entries.
 * These provide an instant, high-quality experience for "nerds" and power users
 * who might open dozens of tabs at once.
 */
export const starterApods: ApodData[] = [
  {
    date: '2023-02-14',
    title: 'The Heart Nebula (IC 1805)',
    explanation: 'The Heart Nebula is an emission nebula in the constellation Cassiopeia. It shows glowing ionized hydrogen gas and darker dust lanes.',
    url: 'https://apod.nasa.gov/apod/image/2302/HeartSoul_deHaro_1080.jpg',
    hdurl: 'https://apod.nasa.gov/apod/image/2302/HeartSoul_deHaro_1977.jpg',
    media_type: 'image',
    object_type: 'Nebula',
    width: 2000,
    height: 1600
  },
  {
    date: '2021-02-14',
    title: 'The Soul Nebula (IC 1848)',
    explanation: 'The Soul Nebula is an emission nebula in Cassiopeia. It is several light-years across and is a region of active star formation.',
    url: 'https://apod.nasa.gov/apod/image/2102/rosette_BlockPuckett_960.jpg',
    hdurl: 'https://apod.nasa.gov/apod/image/2102/rosette_BlockPuckett_2918.jpg',
    media_type: 'image',
    object_type: 'Nebula',
    width: 2000,
    height: 1400
  },
  {
    date: '2015-07-14',
    title: 'New Horizons Passes Pluto and Charon',
    explanation: 'Will the New Horizons spacecraft survive its closest approach to Pluto and return useful images and data? Humanity will find out in a few hours. No spacecraft has ever been past Pluto, so exactly what is there and what its moons look like remain to be seen.',
    url: 'https://apod.nasa.gov/apod/image/1507/PlutoCharon01_NewHorizons_1080.jpg',
    hdurl: 'https://apod.nasa.gov/apod/image/1507/PlutoCharon01_NewHorizons_1422.jpg',
    media_type: 'image',
    object_type: 'Planet',
    width: 2000,
    height: 1500
  },
  {
    date: '2012-09-25',
    title: 'Unusual Spheres on Mars',
    explanation: "Why are these strange little spheres on Mars? The robotic rover Opportunity chanced across these unusual nodules on Mars earlier this month. The unusual spheres, seen as almost continuous in the above picture, are a few millimeters across and have formed in the surface near a location unimaginatively called the Kirkwood outcrop. As interesting as they look, what caught the attention of Opportunity scientists is what they didn't see. The spheres don't seem to have the high concentration of iron as the famous Martian blueberries first seen by Opportunity in 2004, and the new spheres don't seem evenly distributed in size -- features usually caused by accretion. For now, the spheres remain a mystery, although their study will likely lead to a better understanding of the ancient Martian climate.",
    url: 'https://apod.nasa.gov/apod/image/1209/spherulesmars_opportunity_960.jpg',
    hdurl: 'https://apod.nasa.gov/apod/image/1209/spherulesmars_opportunity_1809.jpg',
    media_type: 'image',
    object_type: 'Planet',
    width: 2000,
    height: 1500
  },
  {
    date: '2023-10-14',
    title: 'Circular Sun Halo',
    explanation: "Want to see a ring around the Sun? It's easy to do in daytime skies around the world. Created by randomly oriented ice crystals in thin high cirrus clouds, circular 22 degree halos are visible much more often than rainbows. This one was captured by smart phone photography on May 29, 2021 near Rome, Italy. Carefully blocking the Sun, for example with a finger tip, is usually all that it takes to reveal the common bright halo ring.",
    url: 'https://apod.nasa.gov/apod/image/2310/Vincenzo_Mirabella_20210529_134459_1024px.jpg',
    hdurl: 'https://apod.nasa.gov/apod/image/2310/Vincenzo_Mirabella_20210529_134459.jpg',
    media_type: 'image',
    object_type: 'Phenomenon',
    width: 1024,
    height: 768
  }
];
