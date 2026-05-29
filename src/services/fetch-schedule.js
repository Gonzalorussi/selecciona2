import axios  from "axios";

const API_KEY = 'edb15a92cfed9823267f92f35a0e4702';
const BASE_URL = 'https://v3.football.api-sports.io';

async function getWorldCupSchedule() {
  try {
    const response = await axios.get(`${BASE_URL}/fixtures`, {
      params: {
        league: 1,
        season: 2026
      },
      headers: {
        'x-apisports-key': API_KEY
      }
    });

    const fixtures = response.data.response;
    console.log(`Total fixtures: ${fixtures.length}`);

    fixtures.forEach(fixture => {
      const date = new Date(fixture.fixture.date).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });

      console.log(`[${fixture.league.round}] ${date}`);
      console.log(`  ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
      console.log(`  Venue: ${fixture.fixture.venue.name}, ${fixture.fixture.venue.city}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error fetching schedule:', error.message);
  }
}

getWorldCupSchedule();