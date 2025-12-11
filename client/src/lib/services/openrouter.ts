import { GeometryData, DistanceResult, DistanceMode } from "../stores/useGeometry";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function generateGeometry(description: string): Promise<GeometryData> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set. Please configure environment variable.");
  }
  const prompt = `
Bạn là một chuyên gia toán học và lập trình 3D. Hãy tạo một hình 3D từ mô tả: "${description}"

ĐẶC BIỆT QUAN TRỌNG - THEO CHUẨN SGK TOÁN HỌC:
- Material PHẢI trong suốt: THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
- PHẢI có vertices với các nhãn đúng theo SGK:
  * Hình hộp: A,B,C,D (đáy dưới), A',B',C',D' (đáy trên)
  * Hình chóp: S (đỉnh), A,B,C,D (đáy)
  * Lăng trụ: A,B,C (đáy dưới), A',B',C' (đáy trên)
- PHẢI có hiddenEdges: mảng các cặp đỉnh tạo thành cạnh bị che khuất (vẽ nét đứt)
- ĐƠN VỊ: PHẢI dùng "m" (mét) cho tất cả kích thước, KHÔNG dùng "đơn vị"

XỬ LÝ CÁC ĐIỂM ĐẶC BIỆT (QUAN TRỌNG):
Nếu mô tả có các điểm phụ, PHẢI thêm vào vertices và auxiliaryLines:
- "SH là đường cao" → thêm điểm H (chân đường cao) vào vertices, thêm ["S","H"] vào auxiliaryLines
- "M là trung điểm AB" → tính tọa độ M = (A+B)/2, thêm vào vertices
- "O là tâm đáy" → tính tọa độ tâm, thêm điểm O
- "I là giao điểm" → tính tọa độ giao điểm, thêm điểm I

VÍ DỤ: "hình chóp SABCD, SH là đường cao"
- Thêm vertices: [..., {"position": [0, -h/2, 0], "label": "H"}]
- Thêm auxiliaryLines: [["S","H"]] (đường cao vẽ nét đứt màu xanh)
- Thêm properties: "Đường cao SH": "2 m"

QUY TẮC ĐẶT TÊN VÀ VỊ TRÍ ĐỈNH:
- Hình hộp ABCD.A'B'C'D':
  * Đáy dưới (y=-h/2): A (trước-trái), B (trước-phải), C (sau-phải), D (sau-trái)
  * Đáy trên (y=h/2): A' (trên A), B' (trên B), C' (trên C), D' (trên D)
  * Cạnh bị che: ["A","D"], ["D","C"], ["A'","D'"], ["D'","C'"], ["D","D'"]

- Hình chóp SABCD:
  * S ở đỉnh [0, h/2, 0]
  * Đáy ABCD: A,B,C,D theo thứ tự ngược chiều kim đồng hồ từ trên nhìn xuống
  * Cạnh bị che: những cạnh phía sau (phụ thuộc góc nhìn)

GEOMETRY:
- Hình hộp: THREE.BoxGeometry(w, h, d)
- Lăng trụ tam giác: THREE.CylinderGeometry(r, r, h, 3)
- Lăng trụ tứ giác: THREE.BoxGeometry(w, h, d)
- Hình chóp tam giác: THREE.ConeGeometry(r, h, 3)
- Hình chóp tứ giác: THREE.ConeGeometry(r, h, 4)

Trả về ĐÚNG định dạng JSON:
{
  "type": "Tên hình",
  "description": "Mô tả",
  "threeJsCode": "...",
  "properties": {...},
  "formulas": [...],
  "vertices": [{"position": [x,y,z], "label": "A"}, ...],
  "hiddenEdges": [["A","D"], ["D","C"], ["D","D'"]],
  "auxiliaryLines": [["S","H"], ["A","M"]]
}

THÊM PARAMETERS, EDGES, VÀ ANGLES:
- parameters: mảng các tham số có thể chỉnh sửa (chiều cao, chiều dài cạnh tổng quát...)
- edges: mảng TẤT CẢ các cạnh của hình với chiều dài riêng lẻ
  * Mỗi edge có: name (tên cạnh VD: "SA"), from (đỉnh đầu), to (đỉnh cuối), length (chiều dài), unit ("m")
  * List ĐẦY ĐỦ tất cả cạnh trong hình (cạnh đáy, cạnh bên, đường cao...)
- angles: mảng các góc quan trọng
  * Mỗi angle có: name (tên góc VD: "SAB"), vertices (3 đỉnh tạo góc: ["S","A","B"]), value (độ lớn góc), unit ("độ" hoặc "rad")
  * Bao gồm góc giữa cạnh bên và đáy, góc giữa các mặt...

VÍ DỤ CHO HÌNH HỘP ABCD.A'B'C'D':
{
  "type": "Hình hộp chữ nhật ABCD.A'B'C'D'",
  "description": "Hình hộp chữ nhật có 8 đỉnh, 12 cạnh và 6 mặt",
  "threeJsCode": "new THREE.Mesh(new THREE.BoxGeometry(3, 2, 2), new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide }))",
  "properties": {
    "Chiều dài": "3 m",
    "Chiều rộng": "2 m",
    "Chiều cao": "2 m"
  },
  "formulas": [
    {"name": "Thể tích", "formula": "V = a × b × c"}
  ],
  "vertices": [
    {"position": [-1.5, -1, 1], "label": "A"},
    {"position": [1.5, -1, 1], "label": "B"},
    {"position": [1.5, -1, -1], "label": "C"},
    {"position": [-1.5, -1, -1], "label": "D"},
    {"position": [-1.5, 1, 1], "label": "A'"},
    {"position": [1.5, 1, 1], "label": "B'"},
    {"position": [1.5, 1, -1], "label": "C'"},
    {"position": [-1.5, 1, -1], "label": "D'"}
  ],
  "hiddenEdges": [["A","D"], ["D","C"], ["A'","D'"], ["D'","C'"], ["D","D'"]],
  "auxiliaryLines": [],
  "parameters": [
    {"name": "width", "label": "Chiều dài", "value": 3, "min": 1, "max": 6, "step": 0.5, "unit": "m"},
    {"name": "height", "label": "Chiều cao", "value": 2, "min": 0.5, "max": 5, "step": 0.5, "unit": "m"},
    {"name": "depth", "label": "Chiều rộng", "value": 2, "min": 1, "max": 6, "step": 0.5, "unit": "m"}
  ],
  "edges": [
    {"name": "AB", "from": "A", "to": "B", "length": 3, "unit": "m"},
    {"name": "BC", "from": "B", "to": "C", "length": 2, "unit": "m"},
    {"name": "CD", "from": "C", "to": "D", "length": 3, "unit": "m"},
    {"name": "DA", "from": "D", "to": "A", "length": 2, "unit": "m"},
    {"name": "A'B'", "from": "A'", "to": "B'", "length": 3, "unit": "m"},
    {"name": "B'C'", "from": "B'", "to": "C'", "length": 2, "unit": "m"},
    {"name": "C'D'", "from": "C'", "to": "D'", "length": 3, "unit": "m"},
    {"name": "D'A'", "from": "D'", "to": "A'", "length": 2, "unit": "m"},
    {"name": "AA'", "from": "A", "to": "A'", "length": 2, "unit": "m"},
    {"name": "BB'", "from": "B", "to": "B'", "length": 2, "unit": "m"},
    {"name": "CC'", "from": "C", "to": "C'", "length": 2, "unit": "m"},
    {"name": "DD'", "from": "D", "to": "D'", "length": 2, "unit": "m"}
  ],
  "angles": [
    {"name": "ABC", "vertices": ["A", "B", "C"], "value": 90, "unit": "độ"},
    {"name": "BCD", "vertices": ["B", "C", "D"], "value": 90, "unit": "độ"},
    {"name": "AA'B", "vertices": ["A", "A'", "B"], "value": 90, "unit": "độ"}
  ]
}

VÍ DỤ CHO HÌNH CHÓP SABCD VỚI ĐƯỜNG CAO SH:
{
  "type": "Hình chóp tứ giác SABCD",
  "description": "Hình chóp tứ giác SABCD có đỉnh S, đáy ABCD là hình vuông, SH là đường cao",
  "threeJsCode": "new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 4), new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide }))",
  "properties": {
    "Cạnh đáy": "3 m",
    "Chiều cao SH": "3 m"
  },
  "formulas": [
    {"name": "Thể tích", "formula": "V = (1/3) × S_day × h"}
  ],
  "vertices": [
    {"position": [0, 1.5, 0], "label": "S"},
    {"position": [-1.5, -1.5, 1.5], "label": "A"},
    {"position": [1.5, -1.5, 1.5], "label": "B"},
    {"position": [1.5, -1.5, -1.5], "label": "C"},
    {"position": [-1.5, -1.5, -1.5], "label": "D"},
    {"position": [0, -1.5, 0], "label": "H"}
  ],
  "hiddenEdges": [["C","D"], ["S","D"]],
  "auxiliaryLines": [["S","H"]],
  "parameters": [
    {"name": "base", "label": "Cạnh đáy", "value": 3, "min": 1, "max": 6, "step": 0.5, "unit": "m"},
    {"name": "height", "label": "Chiều cao", "value": 3, "min": 1, "max": 6, "step": 0.5, "unit": "m"}
  ],
  "edges": [
    {"name": "AB", "from": "A", "to": "B", "length": 3, "unit": "m"},
    {"name": "BC", "from": "B", "to": "C", "length": 3, "unit": "m"},
    {"name": "CD", "from": "C", "to": "D", "length": 3, "unit": "m"},
    {"name": "DA", "from": "D", "to": "A", "length": 3, "unit": "m"},
    {"name": "SA", "from": "S", "to": "A", "length": 3.35, "unit": "m"},
    {"name": "SB", "from": "S", "to": "B", "length": 3.35, "unit": "m"},
    {"name": "SC", "from": "S", "to": "C", "length": 3.35, "unit": "m"},
    {"name": "SD", "from": "S", "to": "D", "length": 3.35, "unit": "m"},
    {"name": "SH", "from": "S", "to": "H", "length": 3, "unit": "m"}
  ],
  "angles": [
    {"name": "SAB", "vertices": ["S", "A", "B"], "value": 60, "unit": "độ"},
    {"name": "SBC", "vertices": ["S", "B", "C"], "value": 60, "unit": "độ"},
    {"name": "ASB", "vertices": ["A", "S", "B"], "value": 63.4, "unit": "độ"},
    {"name": "SHA", "vertices": ["S", "H", "A"], "value": 90, "unit": "độ"}
  ]
}

QUAN TRỌNG:
- Chỉ trả về JSON thuần túy, KHÔNG text giải thích
- KHÔNG tính toán chi tiết hay reasoning
- Trả về JSON đầu tiên, hoàn chỉnh
- Với bài toán phức tạp: ƯỚC LƯỢNG tọa độ hợp lý, không cần tính toán chính xác 100%
- CÔNG THỨC: KHÔNG dùng dấu tiếng Việt trong subscript/superscript (đ→d, á→a). Ví dụ: S_day thay vì S_đáy
`;

  try {
    console.log(`[AI] Generating geometry for: "${description}"`);

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Geometry 3D Generator"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        messages: [
          {
            role: "system",
            content: "Bạn là chuyên gia toán học. QUAN TRỌNG: Trả về JSON ngay lập tức. KHÔNG viết lời giải thích hay tính toán chi tiết. CHỈ trả về JSON thuần túy."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI] API error ${response.status}:`, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[AI] Raw response:`, JSON.stringify(data, null, 2));

    let aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse || aiResponse.trim() === "") {
      aiResponse = data.choices[0]?.message?.reasoning;
      console.log(`[AI] No content field, trying reasoning field:`, aiResponse);
    }

    if (!aiResponse || aiResponse.trim() === "") {
      console.error("[AI] No content in response, full data:", JSON.stringify(data, null, 2));
      throw new Error("No response from AI - model returned empty content");
    }

    console.log(`[AI] AI response content:`, aiResponse);

    let jsonText = aiResponse.trim();

    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[AI] No JSON found in response");
      throw new Error("Invalid AI response format");
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log(`[AI] Parsed result:`, result);

    if (!result.type || !result.description || !result.threeJsCode) {
      console.error("[AI] Incomplete response structure");
      throw new Error("Incomplete AI response");
    }

    if (!result.edges && result.vertices && result.vertices.length > 0) {
      console.log('[AI] No edges in response, generating from vertices...');
      result.edges = generateEdgesFromVertices(result.vertices, result.hiddenEdges || []);
    }

    if (!result.angles && result.vertices && result.vertices.length >= 3) {
      console.log('[AI] No angles in response, generating key angles...');
      result.angles = generateKeyAngles(result.vertices);
    }

    console.log(`[AI] ✓ Successfully generated geometry: ${result.type}`);
    return result;

  } catch (error) {
    console.error("[AI] Error in generateGeometry:", error);
    throw error;
  }
}

export async function calculateDistance(
  geometry: GeometryData,
  distanceMode: DistanceMode,
  selectedElements: string[]
): Promise<DistanceResult> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set. Please configure environment variable.");
  }
  const verticesInfo = geometry.vertices?.map(v => `${v.label}: [${v.position.join(', ')}]`).join('\n') || '';
  const parametersInfo = geometry.parameters?.map(p => `${p.label}: ${p.value} ${p.unit}`).join('\n') || '';

  const element1 = selectedElements[0];
  const element2 = selectedElements[1];

  let taskDescription = '';
  if (distanceMode === 'line-line') {
    taskDescription = `Tính khoảng cách giữa đường thẳng ${element1.replace('-', '')} và đường thẳng ${element2.replace('-', '')}`;
  } else if (distanceMode === 'plane-plane') {
    taskDescription = `Tính khoảng cách giữa mặt phẳng chứa ${element1.replace('base-', '').replace('top-', '').replace('side-', '').replace('face-', '')} và mặt phẳng chứa ${element2.replace('base-', '').replace('top-', '').replace('side-', '').replace('face-', '')}`;
  } else if (distanceMode === 'line-plane') {
    const lineElement = selectedElements.find(e => e.includes('-') && !e.includes('base-') && !e.includes('top-') && !e.includes('side-') && !e.includes('face-'));
    const planeElement = selectedElements.find(e => e.includes('base-') || e.includes('top-') || e.includes('side-') || e.includes('face-'));
    taskDescription = `Tính khoảng cách từ đường thẳng ${lineElement?.replace('-', '')} đến mặt phẳng chứa ${planeElement?.replace('base-', '').replace('top-', '').replace('side-', '').replace('face-', '')}`;
  }

  const prompt = `
Bạn là chuyên gia toán học hình học không gian. Hãy giải bài toán sau:

HÌNH HỌC: ${geometry.type}
${geometry.description}

TỌA ĐỘ CÁC ĐỈNH:
${verticesInfo}

THÔNG SỐ:
${parametersInfo}

BÀI TOÁN: ${taskDescription}

ELEMENTS ĐÃ CHỌN:
- Element 1: ${element1}
- Element 2: ${element2}

YÊU CẦU:
1. Xác định tọa độ các điểm liên quan
2. Tính toán khoảng cách theo công thức hình học không gian
3. Trả về kết quả ĐÚNG định dạng JSON:

{
  "value": <số khoảng cách, đơn vị mét>,
  "formula": "<công thức LaTeX, VD: d(A, (P)) = \\\\frac{|ax_0 + by_0 + cz_0 + d|}{\\\\sqrt{a^2 + b^2 + c^2}}>",
  "description": "<giải thích ngắn gọn bằng tiếng Việt, VD: Khoảng cách từ điểm A đến mặt phẳng (BCD)>"
}

LƯU Ý:
- Formula phải là LaTeX hợp lệ, dùng \\\\frac{}{} cho phân số, \\\\sqrt{} cho căn bậc hai
- Value phải là số thực chính xác
- Description giải thích ngắn gọn, dễ hiểu
- Không dùng ký tự đặc biệt tiếng Việt trong formula (đ→d, ô→o, á→a)

CHỈ TRẢ VỀ JSON, KHÔNG GIẢI THÍCH THÊM.
`;

  console.log("[AI] Calculating distance with prompt:", prompt.substring(0, 500));

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "Geometry Visualization Tool"
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b:free",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[AI] API error:", errorText);
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI không trả về kết quả");
  }

  console.log("[AI] Raw response:", content);

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI không trả về JSON hợp lệ");
  }

  const result = JSON.parse(jsonMatch[0]) as DistanceResult;

  console.log("[AI] Parsed result:", result);

  return result;
}

function generateEdgesFromVertices(
  vertices: Array<{position: [number, number, number], label: string}>,
  hiddenEdges: Array<[string, string]>
): Array<{name: string, from: string, to: string, length: number, unit: string}> {
  const edges: Array<{name: string, from: string, to: string, length: number, unit: string}> = [];
  const allDistances: Array<{v1: any, v2: any, length: number}> = [];

  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const v1 = vertices[i];
      const v2 = vertices[j];

      const dx = v2.position[0] - v1.position[0];
      const dy = v2.position[1] - v1.position[1];
      const dz = v2.position[2] - v1.position[2];
      const length = Math.sqrt(dx*dx + dy*dy + dz*dz);

      allDistances.push({ v1, v2, length });
    }
  }

  allDistances.sort((a, b) => a.length - b.length);

  const numEdges = Math.min(12, Math.ceil(vertices.length * 1.5));

  for (let i = 0; i < Math.min(numEdges, allDistances.length); i++) {
    const { v1, v2, length } = allDistances[i];
    const edgeName = `${v1.label}${v2.label}`;
    edges.push({
      name: edgeName,
      from: v1.label,
      to: v2.label,
      length: parseFloat(length.toFixed(2)),
      unit: 'm'
    });
  }

  return edges;
}

function generateKeyAngles(
  vertices: Array<{position: [number, number, number], label: string}>
): Array<{name: string, vertices: [string, string, string], value: number, unit: string}> {
  const angles: Array<{name: string, vertices: [string, string, string], value: number, unit: string}> = [];

  if (vertices.length < 3) return angles;

  const maxAngles = Math.min(8, vertices.length * 2);

  for (let centerIdx = 0; centerIdx < vertices.length && angles.length < maxAngles; centerIdx++) {
    const center = vertices[centerIdx];

    const distances = vertices
      .map((v, idx) => ({
        idx,
        v,
        dist: idx === centerIdx ? Infinity : Math.sqrt(
          Math.pow(v.position[0] - center.position[0], 2) +
          Math.pow(v.position[1] - center.position[1], 2) +
          Math.pow(v.position[2] - center.position[2], 2)
        )
      }))
      .filter(d => d.dist !== Infinity)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3);

    for (let i = 0; i < distances.length - 1 && angles.length < maxAngles; i++) {
      for (let j = i + 1; j < distances.length && angles.length < maxAngles; j++) {
        const v1 = distances[i].v;
        const v2 = distances[j].v;

        const vec1 = [
          v1.position[0] - center.position[0],
          v1.position[1] - center.position[1],
          v1.position[2] - center.position[2]
        ];
        const vec2 = [
          v2.position[0] - center.position[0],
          v2.position[1] - center.position[1],
          v2.position[2] - center.position[2]
        ];

        const dot = vec1[0]*vec2[0] + vec1[1]*vec2[1] + vec1[2]*vec2[2];
        const mag1 = Math.sqrt(vec1[0]*vec1[0] + vec1[1]*vec1[1] + vec1[2]*vec1[2]);
        const mag2 = Math.sqrt(vec2[0]*vec2[0] + vec2[1]*vec2[1] + vec2[2]*vec2[2]);

        if (mag1 > 0 && mag2 > 0) {
          const cosAngle = dot / (mag1 * mag2);
          const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
          const angleDeg = (angleRad * 180 / Math.PI);

          if (angleDeg > 15 && angleDeg < 165) {
            angles.push({
              name: `${v1.label}${center.label}${v2.label}`,
              vertices: [v1.label, center.label, v2.label],
              value: parseFloat(angleDeg.toFixed(1)),
              unit: 'độ'
            });
          }
        }
      }
    }
  }

  return angles.slice(0, maxAngles);
}
