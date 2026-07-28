// ==================== Opening tree data ====================
// Tree structure: each node has { san, name, desc, threats: [[fromSq,toSq], ...], children: [...] }
// - `san` is this node's move in SAN (relative to its parent position).
// - `name` is shown in the sidebar list only when this node is a "named" branch point;
//    nodes without a name are intermediate moves within a line and are not separately
//    listed, but ARE part of the path when a descendant is selected.
// - `desc` explains the idea/threats in Korean, shown when this node (or a leaf under
//    an unnamed chain) is the active selection.
// - `threats` is a list of [fromSquare, toSquare] pairs (e.g. ["d1","h5"]) drawn as
//    auto-arrows on the board for this position — key tactical/positional points.
// Root nodes: e4 and d4. The UI shows named children as the sidebar list; selecting
// one shows the board at that node's final position, with back = one named node up.

const OPENING_TREE = {
  e4: {
    san: 'e4', name: '1. e4', desc: '가장 공격적인 첫 수 중 하나로, 중앙을 즉시 장악하고 킹사이드 기물들의 개발 경로를 엽니다.',
    threats: [],
    children: [
      {
        san: 'e5', name: null, desc: null, threats: [], children: [
          {
            san: 'Nf3', name: null, desc: null, threats: [], children: [
              {
                san: 'Nc6', name: null, desc: null, threats: [], children: [
                  {
                    san: 'Bb5', name: '루이 로페즈 (Ruy Lopez)',
                    desc: '스페인 오프닝. 비숍으로 나이트를 겨냥해 e5 폰을 간접적으로 압박합니다. 체스 역사상 가장 오래되고 견고한 오프닝 중 하나예요.',
                    threats: [['b5','c6']],
                    children: [
                      {
                        san: 'a6', name: null, desc: null, threats: [], children: [
                          {
                            san: 'Ba4', name: null, desc: null, threats: [], children: [
                              {
                                san: 'Nf6', name: '모르피 디펜스 (Morphy Defense)',
                                desc: '흑의 가장 대중적인 응수. a6로 비숍을 물러나게 한 뒤 나이트로 e4 폰을 공격하며 자연스럽게 기물을 개발합니다.',
                                threats: [['f6','e4']],
                                children: [
                                  {
                                    san: 'O-O', name: null, desc: null, threats: [], children: [
                                      {
                                        san: 'Be7', name: '클로즈드 디펜스 (Closed Defense)',
                                        desc: '가장 견고한 주요 라인. 흑은 비숍을 안전하게 e7에 두고 이후 b5, d6로 서서히 반격을 준비합니다.',
                                        threats: [], children: []
                                      },
                                      {
                                        san: 'Nxe4', name: '오픈 디펜스 (Open/Tarrasch Defense)',
                                        desc: '흑이 즉시 e4 폰을 잡아 개방적인 포지션을 만듭니다. 양측 모두 활동적인 기물 플레이를 노립니다.',
                                        threats: [['e4','f2']], children: []
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          },
                          {
                            san: 'Bxc6', name: '익스체인지 베리에이션 (Exchange Variation)',
                            desc: '백이 비숍을 나이트와 교환해 흑의 폰 구조를 이중폰으로 망가뜨립니다. 대신 흑은 비숍 쌍의 이점을 얻습니다.',
                            threats: [], children: []
                          }
                        ]
                      },
                      {
                        san: 'Nf6', name: '베를린 디펜스 (Berlin Defense)',
                        desc: '"베를린 장벽"이라 불리는 견고한 수비 라인. 나이트로 e4 폰을 공격하며 최고 수준 대국에서 무승부율이 매우 높습니다.',
                        threats: [['f6','e4']],
                        children: [
                          {
                            san: 'O-O', name: null, desc: null, threats: [], children: [
                              {
                                san: 'Nxe4', name: '베를린 엔드게임 (Berlin Endgame)',
                                desc: '퀸 교환이 일어나는 유명한 엔드게임 라인. 흑은 더블폰이 생기지만 비숍 쌍과 견고한 구조로 버팁니다.',
                                threats: [], children: []
                              }
                            ]
                          }
                        ]
                      },
                      {
                        san: 'd6', name: '스타이니츠 디펜스 (Steinitz Defense)',
                        desc: '흑이 즉시 d6로 e5 폰을 지키며 비숍이 갇히는 것을 방지합니다. 다소 수동적이지만 견고합니다.',
                        threats: [], children: []
                      },
                      {
                        san: 'Bc5', name: '클래시컬 디펜스 (Cordel Defense)',
                        desc: '흑이 즉시 비숍을 활동적인 c5로 전개해 f2를 노립니다. 초기 체스 역사에서 자주 쓰인 라인입니다.',
                        threats: [['c5','f2']], children: []
                      },
                      {
                        san: 'f5', name: '슐리만 디펜스 (Schliemann Defense)',
                        desc: '흑이 즉각적으로 날카로운 반격을 시도하는 갬빗성 응수. 매우 공격적이고 이론이 복잡합니다.',
                        threats: [], children: []
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            san: 'Nc3', name: '비엔나 게임 (Vienna Game)',
            desc: '나이트를 c3로 개발하며 킹스 갬빗과 비슷한 공격적 아이디어를 유지하되 좀 더 유연한 접근을 취합니다.',
            threats: [], children: []
          },
          {
            san: 'f4', name: '킹스 갬빗 (King\'s Gambit)',
            desc: '폰을 희생해 중앙을 빠르게 장악하고 흑의 킹사이드를 공략하는 고전적이고 공격적인 갬빗입니다.',
            threats: [['f4','e5']], children: []
          }
        ]
      },
      {
        san: 'c5', name: '시실리안 디펜스 (Sicilian Defense)',
        desc: '흑의 가장 인기 있는 응수. 비대칭적인 폰 구조를 만들어 양측 모두에게 승부처가 있는 날카로운 게임을 유도합니다.',
        threats: [],
        children: [
          {
            san: 'Nf3', name: null, desc: null, threats: [], children: [
              {
                san: 'd6', name: null, desc: null, threats: [], children: [
                  {
                    san: 'd4', name: null, desc: null, threats: [], children: [
                      {
                        san: 'cxd4', name: null, desc: null, threats: [], children: [
                          {
                            san: 'Nxd4', name: null, desc: null, threats: [], children: [
                              {
                                san: 'Nf6', name: null, desc: null, threats: [], children: [
                                  {
                                    san: 'Nc3', name: null, desc: null, threats: [], children: [
                                      {
                                        san: 'a6', name: '나이도르프 베리에이션 (Najdorf Variation)',
                                        desc: '가장 깊이 연구된 시실리안 라인. a6로 b5 칸을 통제하고 이후 퀸사이드 반격(b5)을 준비합니다. 피셔와 카스파로프가 즐겨 썼습니다.',
                                        threats: [], children: []
                                      },
                                      {
                                        san: 'g6', name: '드래곤 베리에이션 (Dragon Variation)',
                                        desc: '흑이 다크 비숍을 g7로 피앙케토해 긴 대각선을 장악합니다. 가장 공격적인 시실리안 라인 중 하나입니다.',
                                        threats: [['g7','a1']], children: []
                                      },
                                      {
                                        san: 'e6', name: '스케베닝겐 베리에이션 (Scheveningen)',
                                        desc: 'd6와 e6로 작은 중앙을 구축해 견고한 방어벽을 세우고 d5나 e5로의 폰 브레이크를 유연하게 준비합니다.',
                                        threats: [], children: []
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                san: 'e6', name: '타이마노프 베리에이션 (Taimanov Variation)',
                desc: '유연하고 안정적인 세팅으로, 나이트를 c6로 자연스럽게 개발하며 여러 시실리안 구조로 전환할 수 있습니다.',
                threats: [], children: []
              },
              {
                san: 'Nc6', name: null, desc: null, threats: [], children: [
                  {
                    san: 'd4', name: null, desc: null, threats: [], children: [
                      {
                        san: 'cxd4', name: null, desc: null, threats: [], children: [
                          {
                            san: 'Nxd4', name: null, desc: null, threats: [], children: [
                              {
                                san: 'Nf6', name: null, desc: null, threats: [], children: [
                                  {
                                    san: 'Nc3', name: null, desc: null, threats: [], children: [
                                      {
                                        san: 'e5', name: '스베시니코프 베리에이션 (Sveshnikov)',
                                        desc: '흑이 곧바로 e5로 백의 나이트를 쫓아내며 공간을 얻습니다. 대신 d5 칸이 영구적으로 약해지지만 매우 역동적인 게임이 됩니다.',
                                        threats: [], children: []
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            san: 'c3', name: '알라핀 베리에이션 (Alapin Variation)',
            desc: '백이 방대한 이론을 피하면서 d4로 중앙을 준비하는 실용적인 선택입니다.',
            threats: [], children: []
          }
        ]
      },
      {
        san: 'e6', name: '프렌치 디펜스 (French Defense)',
        desc: '흑이 견고한 폰 사슬을 구축하지만 다크 비숍이 갇히기 쉽습니다. 견고함과 반격 기회(c5, f6)를 동시에 노립니다.',
        threats: [], children: []
      },
      {
        san: 'c6', name: '카로칸 디펜스 (Caro-Kann Defense)',
        desc: '프렌치와 비슷하지만 비숍을 먼저 밖으로 꺼낼 수 있어 더 견고합니다. 실수하기 어려운 안정적인 오프닝입니다.',
        threats: [], children: []
      },
      {
        san: 'd5', name: '스칸디나비안 디펜스 (Scandinavian Defense)',
        desc: '흑이 즉시 중앙에서 폰을 교환하며 퀸을 일찍 꺼내는 대담한 시도입니다. 백은 템포 이득을 볼 수 있습니다.',
        threats: [], children: []
      },
      {
        san: 'd6', name: '피르츠 디펜스 (Pirc Defense)',
        desc: '흑이 중앙을 폰 대신 기물로 통제하는 하이퍼모던 스타일의 오프닝입니다.',
        threats: [], children: []
      },
      {
        san: 'Nf6', name: '알레힌 디펜스 (Alekhine\'s Defense)',
        desc: '흑이 도발적으로 나이트를 전진시켜 백의 폰들이 앞으로 나오게 유도한 뒤, 그 확장된 중앙을 나중에 공격합니다.',
        threats: [], children: []
      },
      {
        san: 'g6', name: '모던 디펜스 (Modern Defense)',
        desc: '흑이 즉시 비숍을 피앙케토하며 유연하게 백의 중앙 확장을 지켜본 뒤 반격 지점을 정합니다.',
        threats: [], children: []
      }
    ]
  },
  d4: {
    san: 'd4', name: '1. d4', desc: '중앙을 폰으로 장악하면서도 e4보다 안전한 구조를 유지하는 전략적인 첫 수입니다.',
    threats: [],
    children: [
      {
        san: 'd5', name: null, desc: null, threats: [], children: [
          {
            san: 'c4', name: '퀸즈 갬빗 (Queen\'s Gambit)',
            desc: '백이 사이드 폰을 내주는 척하며 중앙을 완전히 장악하려는 시도입니다. 실제로는 폰을 오래 지키기 어렵습니다.',
            threats: [['c4','d5']],
            children: [
              {
                san: 'dxc4', name: '퀸즈 갬빗 어셉티드 (QGA)',
                desc: '흑이 폰을 받아먹지만, 오래 지키지 못하고 결국 백이 중앙에서 활동성을 얻습니다.',
                threats: [], children: []
              },
              {
                san: 'e6', name: '퀸즈 갬빗 디클라인드 (QGD)',
                desc: '흑이 갬빗을 거절하고 견고하게 중앙을 지킵니다. 가장 고전적이고 이론이 깊은 라인입니다.',
                threats: [], children: []
              },
              {
                san: 'c6', name: '슬라브 디펜스 (Slav Defense)',
                desc: '흑이 c6로 폰을 지원하면서 다크 비숍을 밖으로 꺼낼 경로를 열어둡니다. QGD보다 능동적입니다.',
                threats: [], children: []
              }
            ]
          }
        ]
      },
      {
        san: 'Nf6', name: null, desc: null, threats: [], children: [
          {
            san: 'c4', name: null, desc: null, threats: [], children: [
              {
                san: 'g6', name: null, desc: null, threats: [], children: [
                  {
                    san: 'Nc3', name: null, desc: null, threats: [], children: [
                      {
                        san: 'Bg7', name: '킹스 인디언 디펜스 (King\'s Indian Defense)',
                        desc: '흑이 하이퍼모던 스타일로 비숍을 피앙케토한 뒤 나중에 e5나 f5로 강력한 킹사이드 공격을 노립니다.',
                        threats: [['g7','a1']], children: []
                      },
                      {
                        san: 'd5', name: '그린펠드 디펜스 (Grünfeld Defense)',
                        desc: '흑이 중앙 폰을 내주는 대신 기물로 압박하며 백의 중앙을 역공하는 매우 역동적인 오프닝입니다.',
                        threats: [], children: []
                      }
                    ]
                  }
                ]
              },
              {
                san: 'e6', name: null, desc: null, threats: [], children: [
                  {
                    san: 'Nc3', name: null, desc: null, threats: [], children: [
                      {
                        san: 'Bb4', name: '니므조 인디언 디펜스 (Nimzo-Indian Defense)',
                        desc: '흑이 비숍으로 나이트를 핀하며 백이 이상적인 폰 중앙(e4)을 만들지 못하게 방해합니다. 가장 견고한 d4 대응책 중 하나입니다.',
                        threats: [['b4','c3']], children: []
                      }
                    ]
                  },
                  {
                    san: 'Nf3', name: null, desc: null, threats: [], children: [
                      {
                        san: 'b6', name: '퀸즈 인디언 디펜스 (Queen\'s Indian Defense)',
                        desc: '흑이 퀸사이드 비숍을 피앙케토해 e4와 d5 중앙 칸들을 통제합니다. 니므조 인디언의 자매 오프닝입니다.',
                        threats: [], children: []
                      }
                    ]
                  }
                ]
              },
              {
                san: 'c5', name: '베노니 디펜스 (Benoni Defense)',
                desc: '흑이 즉각적으로 중앙에서 반격해 비대칭적이고 날카로운 포지션을 만듭니다.',
                threats: [], children: []
              }
            ]
          },
          {
            san: 'Bg5', name: '트롬포프스키 어택 (Trompowsky Attack)',
            desc: '백이 이론을 최소화하면서도 흑의 나이트를 즉시 압박하는 실용적인 선택입니다.',
            threats: [['g5','f6']], children: []
          },
          {
            san: 'Nf3', name: null, desc: null, threats: [], children: [
              {
                san: 'd5', name: null, desc: null, threats: [], children: [
                  {
                    san: 'Bf4', name: '런던 시스템 (London System)',
                    desc: '백이 어느 흑의 응수에도 거의 동일한 견고한 구조를 세우는 실용적이고 배우기 쉬운 시스템입니다.',
                    threats: [], children: []
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        san: 'f5', name: '더치 디펜스 (Dutch Defense)',
        desc: '흑이 킹사이드 공간을 확보하며 공격적인 게임을 노리는 다소 위험하지만 활동적인 오프닝입니다.',
        threats: [], children: []
      }
    ]
  }
};

if (typeof module !== 'undefined') module.exports = { OPENING_TREE };
