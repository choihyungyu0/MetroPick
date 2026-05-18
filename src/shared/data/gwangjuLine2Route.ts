export type GwangjuLine2RouteStation = {
  id: string
  lat: number
  lng: number
  name: string
  showLabel: boolean
}

export const gwangjuLine2RouteStations = [
  { id: 'line2-238', name: '유덕동 예정역', lat: 35.168162, lng: 126.848539, showLabel: true },
  { id: 'line2-201', name: '치평동 예정역', lat: 35.157955, lng: 126.848321, showLabel: false },
  { id: 'line2-202', name: '치평동 예정역', lat: 35.152441, lng: 126.848259, showLabel: false },
  {
    id: 'line2-203',
    name: '상무2동 예정역',
    lat: 35.147238,
    lng: 126.848913,
    showLabel: true,
  },
  { id: 'line2-204', name: '쌍촌동 예정역', lat: 35.144039, lng: 126.857238, showLabel: false },
  { id: 'line2-205', name: '금호1동 예정역', lat: 35.137381, lng: 126.858908, showLabel: false },
  {
    id: 'line2-206',
    name: '금호2동 예정역',
    lat: 35.132738,
    lng: 126.860706,
    showLabel: true,
  },
  { id: 'line2-207', name: '풍암동 예정역', lat: 35.134021, lng: 126.872636, showLabel: false },
  {
    id: 'line2-208',
    name: '풍암동 예정역',
    lat: 35.126934,
    lng: 126.876891,
    showLabel: true,
  },
  { id: 'line2-209', name: '풍암동 예정역', lat: 35.129958, lng: 126.886322, showLabel: false },
  { id: 'line2-210', name: '주월1동 예정역', lat: 35.133842, lng: 126.89617, showLabel: false },
  { id: 'line2-211', name: '봉선1동 예정역', lat: 35.133075, lng: 126.902103, showLabel: false },
  {
    id: 'line2-212',
    name: '봉선2동 예정역',
    lat: 35.133892,
    lng: 126.910936,
    showLabel: true,
  },
  { id: 'line2-213', name: '방림2동 예정역', lat: 35.135237, lng: 126.917526, showLabel: false },
  { id: 'line2-214', name: '학운동 예정역', lat: 35.139384, lng: 126.92287, showLabel: false },
  {
    id: 'line2-215',
    name: '서남동 예정역',
    lat: 35.144429,
    lng: 126.926185,
    showLabel: true,
  },
  { id: 'line2-216', name: '지산2동 예정역', lat: 35.151519, lng: 126.930706, showLabel: false },
  {
    id: 'line2-217',
    name: '산수2동 예정역',
    lat: 35.159298,
    lng: 126.931113,
    showLabel: true,
  },
  { id: 'line2-218', name: '문화동 예정역', lat: 35.164275, lng: 126.921829, showLabel: false },
  { id: 'line2-219', name: '중흥1동 예정역', lat: 35.166181, lng: 126.914173, showLabel: true },
] as const satisfies readonly GwangjuLine2RouteStation[]
