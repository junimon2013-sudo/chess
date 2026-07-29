// ==================== Opening tree data (v2) ====================
// Every node (named or not) now carries `desc` and `threats`, since the UI
// walks the tree one real move at a time and shows both at every step.
// Structure per node: { san, name, desc, threats: [[from,to],...], children: [...] }
// Four root keys: e4, d4 (deep trees), reti (Nf3), english (c4) (shallow trees).

const OPENING_TREE = {
  e4: {
    san: 'e4', name: '1. e4', desc: '가장 공격적인 첫 수 중 하나로, 중앙을 즉시 장악하고 킹사이드 기물들의 개발 경로를 엽니다.',
    threats: [['e2','e4']],
    children: [
      {
        san: 'e5', name: null, desc: '흑도 동일하게 중앙을 점유하며 대칭적인 균형을 맞춥니다. 가장 고전적인 응수입니다.',
        threats: [['e7','e5']],
        children: [
          {
            san: 'Nf3', name: null, desc: '나이트를 개발하며 e5 폰을 직접 공격합니다. 흑은 이를 지키거나 반격해야 합니다.',
            threats: [['f3','e5']],
            children: [
              {
                san: 'Nc6', name: null, desc: '나이트로 e5 폰을 방어하며 자연스럽게 기물을 개발합니다.',
                threats: [['c6','e5']],
                children: [
                  {
                    san: 'Bb5', name: '루이 로페즈 (Ruy Lopez)',
                    desc: '스페인 오프닝. 비숍으로 나이트를 겨냥해 e5 폰을 간접적으로 압박합니다. 체스 역사상 가장 오래되고 견고한 오프닝 중 하나예요.',
                    threats: [['b5','c6']],
                    children: [
                      {
                        san: 'a6', name: null, desc: '흑이 비숍에게 "선택하라"고 요구합니다: 나이트를 잡든지 물러나든지.',
                        threats: [['a6','b5']],
                        children: [
                          {
                            san: 'Ba4', name: null, desc: '비숍이 물러나면서도 계속 나이트를 겨냥하는 압박을 유지합니다.',
                            threats: [['a4','c6']],
                            children: [
                              {
                                san: 'Nf6', name: '모르피 디펜스 (Morphy Defense)',
                                desc: '흑의 가장 대중적인 응수. a6로 비숍을 물러나게 한 뒤 나이트로 e4 폰을 공격하며 자연스럽게 기물을 개발합니다.',
                                threats: [['f6','e4']],
                                children: [
                                  {
                                    san: 'O-O', name: null, desc: '백이 캐슬링으로 킹을 안전하게 하며 이후 Re1로 e5/e4 국면을 준비합니다.',
                                    threats: [], children: [
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
                            threats: [['c6','d7']], children: []
                          }
                        ]
                      },
                      {
                        san: 'Nf6', name: '베를린 디펜스 (Berlin Defense)',
                        desc: '"베를린 장벽"이라 불리는 견고한 수비 라인. 나이트로 e4 폰을 공격하며 최고 수준 대국에서 무승부율이 매우 높습니다.',
                        threats: [['f6','e4']],
                        children: [
                          {
                            san: 'O-O', name: null, desc: '백이 캐슬링으로 안전을 확보하며 e4 폰을 내주더라도 이후 계획을 세웁니다.',
                            threats: [], children: [
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
                        threats: [['d6','e5']], children: []
                      },
                      {
                        san: 'Bc5', name: '클래시컬 디펜스 (Cordel Defense)',
                        desc: '흑이 즉시 비숍을 활동적인 c5로 전개해 f2를 노립니다. 초기 체스 역사에서 자주 쓰인 라인입니다.',
                        threats: [['c5','f2']], children: []
                      },
                      {
                        san: 'f5', name: '슐리만 디펜스 (Schliemann Defense)',
                        desc: '흑이 즉각적으로 날카로운 반격을 시도하는 갬빗성 응수. 매우 공격적이고 이론이 복잡합니다.',
                        threats: [['f5','e4']], children: []
                      }
                    ]
                  },
                  {
                    san: 'Bc4', name: '이탈리안 게임 (Italian Game)',
                    desc: '비숍을 활동적인 대각선(c4-f7)에 두어 흑의 가장 약한 지점인 f7을 겨냥합니다.',
                    threats: [['c4','f7']],
                    children: [
                      {
                        san: 'Bc5', name: '지오코 피아노 (Giuoco Piano)',
                        desc: '"조용한 게임"이라는 뜻처럼 서로 대칭적으로 비숍을 전개하며 전략적인 포지션 싸움으로 이어집니다.',
                        threats: [['c5','f2']], children: []
                      },
                      {
                        san: 'Nf6', name: '투 나이츠 디펜스 (Two Knights Defense)',
                        desc: '흑이 즉시 반격하며 f7 약점보다 자신의 기물 개발과 중앙 장악을 우선시하는 날카로운 라인입니다.',
                        threats: [['f6','e4']], children: []
                      }
                    ]
                  },
                  {
                    san: 'd4', name: '스코치 게임 (Scotch Game)',
                    desc: '백이 즉시 중앙에서 폰을 교환해 기물 활동성을 높이고 빠르게 오픈 포지션을 만듭니다.',
                    threats: [['d4','e5']], children: []
                  }
                ]
              },
              {
                san: 'Nf6', name: '페트로프 디펜스 (Petrov Defense)',
                desc: '흑이 방어 대신 똑같이 반격하며 e4 폰을 노립니다. 매우 안전하고 무승부 확률이 높은 라인입니다.',
                threats: [['f6','e4']], children: []
              }
            ]
          },
          {
            san: 'Nc3', name: '비엔나 게임 (Vienna Game)',
            desc: '나이트를 c3로 개발하며 킹스 갬빗과 비슷한 공격적 아이디어를 유지하되 좀 더 유연한 접근을 취합니다.',
            threats: [['c3','d5']], children: []
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
        threats: [['c5','d4']],
        children: [
          {
            san: 'Nf3', name: null, desc: '백이 자연스럽게 나이트를 개발하며 중앙 d4 브레이크를 준비합니다.',
            threats: [['f3','d4']],
            children: [
              {
                san: 'd6', name: null, desc: '흑이 나이트를 위해 d6 칸을 마련하고 e5를 지원할 준비를 합니다.',
                threats: [['d6','e5']],
                children: [
                  {
                    san: 'd4', name: null, desc: '백이 중앙에서 폰 교환을 유도해 나이트를 활발한 중앙 칸으로 보낼 준비를 합니다.',
                    threats: [['d4','c5']],
                    children: [
                      {
                        san: 'cxd4', name: null, desc: '흑이 중앙 폰을 잡으며 비대칭 구조를 확정 짓습니다.',
                        threats: [['d4','c5']],
                        children: [
                          {
                            san: 'Nxd4', name: null, desc: '나이트가 강력한 중앙 칸 d4를 차지하며 시실리안의 전형적인 구조가 완성됩니다.',
                            threats: [['d4','c6']],
                            children: [
                              {
                                san: 'Nf6', name: null, desc: '흑이 나이트로 e4 칸을 압박하며 개발을 마칩니다.',
                                threats: [['f6','e4']],
                                children: [
                                  {
                                    san: 'Nc3', name: null, desc: '백이 나이트를 개발해 e4 칸을 보강하고 d5 확장을 준비합니다.',
                                    threats: [['c3','d5']],
                                    children: [
                                      {
                                        san: 'a6', name: '나이도르프 베리에이션 (Najdorf Variation)',
                                        desc: '가장 깊이 연구된 시실리안 라인. a6로 b5 칸을 통제하고 이후 퀸사이드 반격(b5)을 준비합니다. 피셔와 카스파로프가 즐겨 썼습니다.',
                                        threats: [['a6','b5']], children: []
                                      },
                                      {
                                        san: 'g6', name: '드래곤 베리에이션 (Dragon Variation)',
                                        desc: '흑이 다크 비숍을 g7로 피앙케토해 긴 대각선을 장악합니다. 가장 공격적인 시실리안 라인 중 하나입니다.',
                                        threats: [['g7','a1']], children: []
                                      },
                                      {
                                        san: 'e6', name: '스케베닝겐 베리에이션 (Scheveningen)',
                                        desc: 'd6와 e6로 작은 중앙을 구축해 견고한 방어벽을 세우고 d5나 e5로의 폰 브레이크를 유연하게 준비합니다.',
                                        threats: [['e6','d5']], children: []
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
                threats: [['e6','d5']], children: []
              },
              {
                san: 'Nc6', name: null, desc: '흑이 나이트를 먼저 개발하며 여러 시실리안 구조로 전환할 유연성을 유지합니다.',
                threats: [['c6','d4']],
                children: [
                  {
                    san: 'd4', name: null, desc: '백이 역시 중앙 교환을 유도해 나이트를 중앙으로 보낼 준비를 합니다.',
                    threats: [['d4','c5']],
                    children: [
                      {
                        san: 'cxd4', name: null, desc: '흑이 중앙 폰을 잡습니다.',
                        threats: [['d4','c5']],
                        children: [
                          {
                            san: 'Nxd4', name: null, desc: '나이트가 d4의 강력한 중앙 칸을 차지합니다.',
                            threats: [['d4','c6']],
                            children: [
                              {
                                san: 'Nf6', name: null, desc: '흑이 나이트로 e4를 압박하며 개발합니다.',
                                threats: [['f6','e4']],
                                children: [
                                  {
                                    san: 'Nc3', name: null, desc: '백이 나이트를 개발해 e4를 보강합니다.',
                                    threats: [['c3','d5']],
                                    children: [
                                      {
                                        san: 'e5', name: '스베시니코프 베리에이션 (Sveshnikov)',
                                        desc: '흑이 곧바로 e5로 백의 나이트를 쫓아내며 공간을 얻습니다. 대신 d5 칸이 영구적으로 약해지지만 매우 역동적인 게임이 됩니다.',
                                        threats: [['e5','d4']], children: []
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
            threats: [['c3','d4']], children: []
          }
        ]
      },
      {
        san: 'e6', name: '프렌치 디펜스 (French Defense)',
        desc: '흑이 견고한 폰 사슬을 구축하지만 다크 비숍이 갇히기 쉽습니다. 견고함과 반격 기회(c5, f6)를 동시에 노립니다.',
        threats: [['e6','d5']], children: []
      },
      {
        san: 'c6', name: '카로칸 디펜스 (Caro-Kann Defense)',
        desc: '프렌치와 비슷하지만 비숍을 먼저 밖으로 꺼낼 수 있어 더 견고합니다. 실수하기 어려운 안정적인 오프닝입니다.',
        threats: [['c6','d5']], children: []
      },
      {
        san: 'd5', name: '스칸디나비안 디펜스 (Scandinavian Defense)',
        desc: '흑이 즉시 중앙에서 폰을 교환하며 퀸을 일찍 꺼내는 대담한 시도입니다. 백은 템포 이득을 볼 수 있습니다.',
        threats: [['d5','e4']], children: []
      },
      {
        san: 'd6', name: '피르츠 디펜스 (Pirc Defense)',
        desc: '흑이 중앙을 폰 대신 기물로 통제하는 하이퍼모던 스타일의 오프닝입니다.',
        threats: [], children: []
      },
      {
        san: 'Nf6', name: '알레힌 디펜스 (Alekhine\'s Defense)',
        desc: '흑이 도발적으로 나이트를 전진시켜 백의 폰들이 앞으로 나오게 유도한 뒤, 그 확장된 중앙을 나중에 공격합니다.',
        threats: [['f6','e4']], children: []
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
    threats: [['d2','d4']],
    children: [
      {
        san: 'd5', name: null, desc: '흑도 대칭적으로 중앙을 점유하며 균형 잡힌 구조를 만듭니다.',
        threats: [['d5','d4']],
        children: [
          {
            san: 'c4', name: '퀸즈 갬빗 (Queen\'s Gambit)',
            desc: '백이 사이드 폰을 내주는 척하며 중앙을 완전히 장악하려는 시도입니다. 실제로는 폰을 오래 지키기 어렵습니다.',
            threats: [['c4','d5']],
            children: [
              {
                san: 'dxc4', name: '퀸즈 갬빗 어셉티드 (QGA)',
                desc: '흑이 폰을 받아먹지만, 오래 지키지 못하고 결국 백이 중앙에서 활동성을 얻습니다.',
                threats: [['c4','d5']], children: []
              },
              {
                san: 'e6', name: '퀸즈 갬빗 디클라인드 (QGD)',
                desc: '흑이 갬빗을 거절하고 견고하게 중앙을 지킵니다. 가장 고전적이고 이론이 깊은 라인입니다.',
                threats: [['e6','d5']], children: []
              },
              {
                san: 'c6', name: '슬라브 디펜스 (Slav Defense)',
                desc: '흑이 c6로 폰을 지원하면서 다크 비숍을 밖으로 꺼낼 경로를 열어둡니다. QGD보다 능동적입니다.',
                threats: [['c6','d5']], children: []
              }
            ]
          }
        ]
      },
      {
        san: 'Nf6', name: null, desc: '흑이 중앙을 폰 대신 기물로 통제하며 여러 인디언 계열 오프닝으로 유연하게 전환할 준비를 합니다.',
        threats: [['f6','d5']],
        children: [
          {
            san: 'c4', name: null, desc: '백이 퀸사이드 공간을 확장하며 흑의 다음 계획을 지켜봅니다.',
            threats: [['c4','d5']],
            children: [
              {
                san: 'g6', name: null, desc: '흑이 킹사이드 비숍을 피앙케토할 준비를 하며 킹스 인디언/그린펠드 구조로 향합니다.',
                threats: [],
                children: [
                  {
                    san: 'Nc3', name: null, desc: '백이 나이트를 개발해 중앙 e4 확장을 준비합니다.',
                    threats: [], children: [
                      {
                        san: 'Bg7', name: '킹스 인디언 디펜스 (King\'s Indian Defense)',
                        desc: '흑이 하이퍼모던 스타일로 비숍을 피앙케토한 뒤 나중에 e5나 f5로 강력한 킹사이드 공격을 노립니다.',
                        threats: [['g7','a1']], children: []
                      },
                      {
                        san: 'd5', name: '그린펠드 디펜스 (Grünfeld Defense)',
                        desc: '흑이 중앙 폰을 내주는 대신 기물로 압박하며 백의 중앙을 역공하는 매우 역동적인 오프닝입니다.',
                        threats: [['d5','c4']], children: []
                      }
                    ]
                  }
                ]
              },
              {
                san: 'e6', name: null, desc: '흑이 유연하게 니므조/퀸즈 인디언 구조로 향할 준비를 합니다.',
                threats: [],
                children: [
                  {
                    san: 'Nc3', name: null, desc: '백이 나이트를 개발하며 이상적인 e4 중앙 확장을 노립니다.',
                    threats: [], children: [
                      {
                        san: 'Bb4', name: '니므조 인디언 디펜스 (Nimzo-Indian Defense)',
                        desc: '흑이 비숍으로 나이트를 핀하며 백이 이상적인 폰 중앙(e4)을 만들지 못하게 방해합니다. 가장 견고한 d4 대응책 중 하나입니다.',
                        threats: [['b4','c3']], children: []
                      }
                    ]
                  },
                  {
                    san: 'Nf3', name: null, desc: '백이 나이트를 개발해 유연성을 유지하며 니므조 대신 퀸즈 인디언으로 유도할 수 있습니다.',
                    threats: [], children: [
                      {
                        san: 'b6', name: '퀸즈 인디언 디펜스 (Queen\'s Indian Defense)',
                        desc: '흑이 퀸사이드 비숍을 피앙케토해 e4와 d5 중앙 칸들을 통제합니다. 니므조 인디언의 자매 오프닝입니다.',
                        threats: [['c8','g3']], children: []
                      }
                    ]
                  }
                ]
              },
              {
                san: 'c5', name: '베노니 디펜스 (Benoni Defense)',
                desc: '흑이 즉각적으로 중앙에서 반격해 비대칭적이고 날카로운 포지션을 만듭니다.',
                threats: [['c5','d4']], children: []
              }
            ]
          },
          {
            san: 'Bg5', name: '트롬포프스키 어택 (Trompowsky Attack)',
            desc: '백이 이론을 최소화하면서도 흑의 나이트를 즉시 압박하는 실용적인 선택입니다.',
            threats: [['g5','f6']], children: []
          },
          {
            san: 'Nf3', name: null, desc: '백이 나이트를 자연스럽게 개발하며 여러 시스템으로 유연하게 전환합니다.',
            threats: [],
            children: [
              {
                san: 'd5', name: null, desc: '흑이 중앙을 굳히며 런던 시스템 같은 견고한 구조를 유도합니다.',
                threats: [],
                children: [
                  {
                    san: 'Bf4', name: '런던 시스템 (London System)',
                    desc: '백이 어느 흑의 응수에도 거의 동일한 견고한 구조를 세우는 실용적이고 배우기 쉬운 시스템입니다.',
                    threats: [['f4','b8']], children: []
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
        threats: [['f5','e4']], children: []
      }
    ]
  },
  reti: {
    san: 'Nf3', name: '1. Nf3 (레티 오프닝)',
    desc: '레티 오프닝. 나이트를 먼저 개발해 폰 구조를 확정하지 않고 유연하게 이후 c4나 d4, g3 등으로 전환할 수 있는 하이퍼모던 오프닝입니다.',
    threats: [['g1','f3']],
    children: [
      {
        san: 'd5', name: null, desc: '흑이 중앙을 점유하며 표준적으로 응수합니다.',
        threats: [['d5','d4']],
        children: [
          {
            san: 'c4', name: '레티 갬빗 (Réti Gambit)',
            desc: '백이 측면에서 d5 폰을 압박하며 폰을 내주더라도 활동적인 기물 배치를 노립니다. 카파블랑카를 이긴 것으로 유명한 게임에서 나온 아이디어입니다.',
            threats: [['c4','d5']], children: []
          },
          {
            san: 'g3', name: '킹스 인디언 어택 준비 (King\'s Indian Attack setup)',
            desc: '백이 킹사이드 비숍을 피앙케토하며 나중에 e4 확장과 함께 킹스 인디언 어택 구조로 향합니다.',
            threats: [], children: []
          }
        ]
      },
      {
        san: 'Nf6', name: null, desc: '흑도 대칭적으로 나이트를 개발하며 서로 폰 구조를 늦게 정하는 유연한 게임이 됩니다.',
        threats: [], children: []
      },
      {
        san: 'c5', name: '시메트리컬 잉글리시 전환 (Symmetrical transposition)',
        desc: '흑이 측면에서 공간을 확보하며, 종종 잉글리시 오프닝과 동일한 구조로 전환됩니다.',
        threats: [['c5','d4']], children: []
      }
    ]
  },
  english: {
    san: 'c4', name: '1. c4 (잉글리시 오프닝)',
    desc: '잉글리시 오프닝. 측면 폰으로 중앙 d5 칸을 통제하며 유연하게 여러 구조(시메트리컬, 리버스 시실리안 등)로 전환할 수 있습니다.',
    threats: [['c2','c4']],
    children: [
      {
        san: 'e5', name: '리버스 시실리안 (Reversed Sicilian)',
        desc: '흑이 시실리안과 색이 뒤바뀐 구조를 만들며 동일한 전략적 아이디어를 한 템포 늦게 사용합니다.',
        threats: [['e5','d4']], children: []
      },
      {
        san: 'Nf6', name: null, desc: '흑이 나이트를 개발하며 유연하게 인디언 계열 구조로 전환할 준비를 합니다.',
        threats: [], children: []
      },
      {
        san: 'c5', name: '시메트리컬 잉글리시 (Symmetrical English)',
        desc: '흑이 대칭적으로 같은 폰 구조를 만들어 미묘한 템포 싸움으로 이어지는 균형 잡힌 라인입니다.',
        threats: [['c5','c4']], children: []
      }
    ]
  }
};

// Popularity ranking (1 = most well-known) used only to sort the hover-preview's
// "leads to" list. Based on general theoretical fame / how often each is discussed,
// not live statistics (no such feed is available). Names not listed default to a
// low-priority rank so they still show but sort after ranked ones.
const OPENING_POPULARITY = {
  '루이 로페즈 (Ruy Lopez)': 1,
  '시실리안 디펜스 (Sicilian Defense)': 1,
  '퀸즈 갬빗 (Queen\'s Gambit)': 1,
  '이탈리안 게임 (Italian Game)': 2,
  '킹스 인디언 디펜스 (King\'s Indian Defense)': 2,
  '나이도르프 베리에이션 (Najdorf Variation)': 2,
  '프렌치 디펜스 (French Defense)': 2,
  '카로칸 디펜스 (Caro-Kann Defense)': 2,
  '베를린 디펜스 (Berlin Defense)': 3,
  '드래곤 베리에이션 (Dragon Variation)': 3,
  '니므조 인디언 디펜스 (Nimzo-Indian Defense)': 3,
  '퀸즈 갬빗 디클라인드 (QGD)': 3,
  '슬라브 디펜스 (Slav Defense)': 3,
  '모르피 디펜스 (Morphy Defense)': 4,
  '스코치 게임 (Scotch Game)': 4,
  '킹스 갬빗 (King\'s Gambit)': 4,
  '그린펠드 디펜스 (Grünfeld Defense)': 4,
  '퀸즈 인디언 디펜스 (Queen\'s Indian Defense)': 4,
  '런던 시스템 (London System)': 4,
  '스칸디나비안 디펜스 (Scandinavian Defense)': 5,
  '지오코 피아노 (Giuoco Piano)': 5,
  '투 나이츠 디펜스 (Two Knights Defense)': 5,
  '페트로프 디펜스 (Petrov Defense)': 5,
  '베노니 디펜스 (Benoni Defense)': 5,
  '퀸즈 갬빗 어셉티드 (QGA)': 5,
  '스베시니코프 베리에이션 (Sveshnikov)': 6,
  '스케베닝겐 베리에이션 (Scheveningen)': 6,
  '타이마노프 베리에이션 (Taimanov Variation)': 6,
  '더치 디펜스 (Dutch Defense)': 6,
  '알레힌 디펜스 (Alekhine\'s Defense)': 6,
  '트롬포프스키 어택 (Trompowsky Attack)': 7,
  '알라핀 베리에이션 (Alapin Variation)': 7,
  '비엔나 게임 (Vienna Game)': 7,
  '모던 디펜스 (Modern Defense)': 7,
  '피르츠 디펜스 (Pirc Defense)': 7,
};
function popularityRank(name) {
  return OPENING_POPULARITY[name] || 99;
}

// Collects every named descendant under `node` (not including node itself),
// each tagged with its popularity rank, for use in hover previews.
function collectNamedDescendants(node) {
  const results = [];
  function walk(n) {
    for (const child of (n.children || [])) {
      if (child.name) results.push(child.name);
      walk(child);
    }
  }
  walk(node);
  return results.sort((a, b) => popularityRank(a) - popularityRank(b));
}

if (typeof module !== 'undefined') module.exports = { OPENING_TREE, OPENING_POPULARITY, popularityRank, collectNamedDescendants };
