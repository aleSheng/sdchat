export const ModelsView = () => {
  return (
    <div className="overflow-x-auto w-full">
      <table className="table w-full">
        {/* head */}
        <thead>
          <tr>
            <th>Name</th>
            <th>Model Type</th>
            <th>ema</th>
            <th>Description</th>
            <th>Download URL</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {/* row 1 */}
          <tr>
            <td>
              <div className="flex items-center space-x-3">
                <div>
                  <div className="font-bold">Stable Diffusion</div>
                  <div className="text-sm opacity-50">1.5</div>
                </div>
              </div>
            </td>
            <td>Diffusion-based text-to-image generation model</td>
            <td>ema-only weight</td>
            <td>
              This is a model that can be used to generate and modify images based on
              text prompts. It is a Latent Diffusion Model that uses a fixed, pretrained
              text encoder (CLIP ViT-L/14) as suggested in the Imagen paper.
            </td>
            <td>
              <a href="https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.ckpt">
                Download
              </a>
            </td>
            <th>
              <button className="btn btn-ghost btn-xs">details</button>
            </th>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
