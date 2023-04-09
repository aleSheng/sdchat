# Llama and Alpaca

## directory structure

./dalai

./dalai/venv

./dalai/models

## step by step

1. setup python venv
   python -m pip install virtualenv
   python -m venv ${venv_path}

2. install libraries in windows
   pip install cmake
   pip install --upgrade pip setuptools wheel
   pip install torch torchvision torchaudio sentencepiece numpy

3. install llama.cpp
   git clone https://github.com/ggerganov/llama.cpp.git

4. download models
   obtain the original LLaMA model weights and place them in ./models
   ls ./models
   65B 30B 13B 7B tokenizer_checklist.chk tokenizer.model

5. build llama.cpp

```code
# build this repo
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make

#For Windows and CMake, use the following command instead:
cd <path_to_llama_folder>
mkdir build
cd build
cmake ..
cmake --build . --config Release

```

6. convert the 7B model to ggml FP16 format
   python3 convert-pth-to-ggml.py models/7B/ 1

7. quantize the model to 4-bits (using method 2 = q4_0)
   ./quantize ./models/7B/ggml-model-f16.bin ./models/7B/ggml-model-q4_0.bin 2

8. run the model
   ./main -m ./models/7B/ggml-model-q4_0.bin -n 128

## simplify the process

1. build tools from llama.cpp repo: main.exe, quantize.exe
2. convert original model weights to hf format, using transformers script

```
python src/transformers/models/llama/convert_llama_weights_to_hf.py \
    --input_dir path_to_original_llama_root_dir \
    --model_size 7B \
    --output_dir path_to_original_llama_hf_dir
```

3. merge the base model with the lora model, using Chinese-LLaMA-Alpaca script

```code
python scripts/merge_llama_with_chinese_lora.py \
    --base_model path_to_original_llama_hf_dir \
    --lora_model path_to_chinese_llama_or_alpaca_lora \
    --model_size 7B \
    --output_dir path_to_output_dir
```
