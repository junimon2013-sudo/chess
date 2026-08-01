// ==================== Puzzle data ====================
// Each puzzle: { id, difficulty, type, fen, solution: [[from,to,promo?],...],
//   hintSquare, desc }
// `solution` is the full sequence of moves (both sides) needed to complete the
// puzzle from `fen`, always starting with the side to move. If the puzzle
// involves a forced reply from the opponent, that reply is included too, and
// the UI auto-plays it after the user's correct move.
// `expectMate`: true if the final position must be checkmate; otherwise the
// puzzle just needs the exact move sequence to be played (e.g. winning a piece).
// All positions/solutions here have been verified against the engine.

const PUZZLES = [
  {
    id: 'e1', difficulty: 'easy', type: 'mate',
    fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
    solution: [['e1', 'e8']],
    expectMate: true,
    hintSquare: 'e1',
    desc: '백랭크 메이트: 흑 킹이 자기 폰들에 갇혀 있어요. 룩을 마지막 랭크로 보내보세요.'
  },
  {
    id: 'e2', difficulty: 'easy', type: 'mate',
    fen: 'k7/2K5/8/8/8/8/8/1Q6 w - - 0 1',
    solution: [['b1', 'b7']],
    expectMate: true,
    hintSquare: 'b1',
    desc: '킹과 퀸만으로 메이트하는 기본 코너 패턴이에요. 퀸을 흑 킹 옆 칸으로 보내되, 내 킹이 도망칠 곳을 다 막고 있는지 확인해보세요.'
  },
  {
    id: 'm1', difficulty: 'medium', type: 'tactic-fork',
    fen: '4k3/8/8/3N4/8/8/8/4K3 w - - 0 1',
    solution: [['d5', 'c7']],
    expectMate: false,
    hintSquare: 'd5',
    desc: '나이트 포크 연습: 나이트가 체크를 걸면서 동시에 다른 곳도 노릴 수 있는 자리를 찾아보세요.'
  },
  {
    id: 'm2', difficulty: 'medium', type: 'tactic-pin',
    fen: '4k2r/8/8/8/8/4B3/8/4K3 w - - 0 1',
    solution: [['e3', 'h6']],
    expectMate: false,
    hintSquare: 'e3',
    desc: '비숍을 대각선에 세워 흑 룩을 압박해보세요. 룩이 갇힌 자리에서 움직이기 어려워집니다.'
  },
  {
    id: 'h1', difficulty: 'hard', type: 'mate',
    fen: '5r1k/6pp/7N/3Q4/8/8/8/7K w - - 0 1',
    solution: [['d5', 'g8'], ['f8', 'g8'], ['h6', 'f7']],
    expectMate: true,
    hintSquare: 'd5',
    desc: '스미더드 메이트: 퀸을 희생해서 룩이 강제로 잡게 만든 뒤, 나이트로 마무리하는 클래식 패턴이에요.'
  },
  {
    id: 'e3', difficulty: 'easy', type: 'mate',
    fen: '2r3k1/5ppp/8/8/8/8/8/2R3K1 w - - 0 1',
    solution: [['c1', 'c8']],
    expectMate: true,
    hintSquare: 'c1',
    desc: '흑 룩을 잡으면서 동시에 백랭크 메이트를 완성할 수 있어요. 같은 파일을 잘 살펴보세요.'
  },
  {
    id: 'e4', difficulty: 'easy', type: 'mate',
    fen: '7k/8/5K2/8/8/8/8/6Q1 w - - 0 1',
    solution: [['g1', 'g7']],
    expectMate: true,
    hintSquare: 'g1',
    desc: '퀸과 킹의 협공으로 흑 킹을 코너에 몰아넣는 기본 메이트 패턴이에요.'
  },
  {
    id: 'm3', difficulty: 'medium', type: 'tactic-skewer',
    fen: '3q4/8/8/3k4/8/8/8/R6K w - - 0 1',
    solution: [['a1', 'd1']],
    expectMate: false,
    hintSquare: 'a1',
    desc: '룩을 같은 파일에 세워보세요. 킹이 비켜나면 그 뒤에 있는 퀸을 잡을 수 있는 스큐어 전술이에요.'
  },
  {
    id: 'h2', difficulty: 'hard', type: 'tactic-discovered',
    fen: '3q3k/6p1/8/8/3B4/8/8/3R3K w - - 0 1',
    solution: [['d4', 'g7']],
    expectMate: false,
    hintSquare: 'd4',
    desc: '비숍을 옮기면 뒤에 있던 룩의 공격이 그대로 드러나요. 비숍 자신도 체크를 걸 수 있는 자리를 찾아보세요 (디스커버드 어택).'
  },
  {
    id: 'e5', difficulty: 'easy', type: 'mate',
    fen: '6k1/5ppp/8/8/8/8/1K6/4R3 w - - 0 1',
    solution: [['e1', 'e8']],
    expectMate: true,
    hintSquare: 'e1',
    desc: '또 다른 백랭크 메이트 연습이에요. 룩이 마지막 랭크까지 뻥 뚫려 있는지 확인해보세요.'
  },
  {
    id: 'e6', difficulty: 'easy', type: 'mate',
    fen: '4k3/8/4K3/8/8/8/8/7R w - - 0 1',
    solution: [['h1', 'h8']],
    expectMate: true,
    hintSquare: 'h1',
    desc: '킹과 룩이 함께 흑 킹을 마지막 랭크에 가두는 기본 메이트 패턴이에요.'
  },
  {
    id: 'm4', difficulty: 'medium', type: 'tactic-fork',
    fen: '3q3k/8/8/4N3/8/8/8/6K1 w - - 0 1',
    solution: [['e5', 'f7']],
    expectMate: false,
    hintSquare: 'e5',
    desc: '나이트를 움직이면 체크를 걸면서 동시에 퀸도 노릴 수 있는 자리가 있어요. 킹과 퀸을 동시에 공격하는 칸을 찾아보세요.'
  },
  {
    id: 'e7', difficulty: 'easy', type: 'tactic-hanging',
    fen: '4k3/8/8/8/8/2r5/8/B3K3 w - - 0 1',
    solution: [['a1', 'c3']],
    expectMate: false,
    hintSquare: 'a1',
    desc: '흑 룩이 아무런 보호도 받지 못하고 있어요. 대각선으로 바로 잡을 수 있어요.'
  },
  {
    id: 'h3', difficulty: 'hard', type: 'tactic-fork',
    fen: 'r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1',
    solution: [['d5', 'c7']],
    expectMate: false,
    hintSquare: 'd5',
    desc: '나이트가 체크를 걸면서 동시에 룩도 노릴 수 있는 자리를 찾아보세요. 두 목표를 한 번에 노리는 포크예요.'
  },
  {
    id: 'e8', difficulty: 'easy', type: 'tactic-hanging',
    fen: '4k3/8/2q5/8/8/8/8/4K2B w - - 0 1',
    solution: [['h1', 'c6']],
    expectMate: false,
    hintSquare: 'h1',
    desc: '흑 퀸이 대각선 위에 무방비로 놓여 있어요. 비숍으로 바로 잡을 수 있어요.'
  },
];

if (typeof module !== 'undefined') module.exports = { PUZZLES };
