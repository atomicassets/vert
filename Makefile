CONTAINER = build-vert
DOCKER_DEV_VERSION = v5.0.3wax02-v4.0.1-wax1.0.0
DOCKER_COMMON = -v `pwd`:`pwd` --name ${CONTAINER} -w `pwd` waxteam/waxdev:${DOCKER_DEV_VERSION}


# Docker commands
dev-docker-stop:
	@-docker rm ${CONTAINER}

dev-docker-start: dev-docker-stop
	docker run ${AS_LOCAL} -it ${DOCKER_COMMON} bash -l

docker-build: dev-docker-stop
	docker run --rm ${DOCKER_COMMON} bash -c '\
		echo "Installing wabt..." && \
		apt-get update -qq && apt-get install -y -qq wabt && \
		export_memory() { \
			local wasm_file=$$1; \
			echo "Exporting memory for $$wasm_file..."; \
			wasm2wat $$wasm_file | sed -e "s|(memory |(memory (export \"memory\") |" > $${wasm_file}.tmp.wat && \
			wat2wasm -o $$wasm_file $${wasm_file}.tmp.wat && \
			rm $${wasm_file}.tmp.wat; \
		}; \
		cd examples && \
		echo "Building timer contract..." && \
		cdt-cpp timer/timer.cpp -o timer/timer.wasm && \
		export_memory timer/timer.wasm && \
		echo "Building foo contract..." && \
		cdt-cpp foo/foo.cpp -o foo/foo.wasm && \
		export_memory foo/foo.wasm && \
		echo "Building fixtures contract..." && \
		cdt-cpp fixtures/fixtures.cpp -o fixtures/fixtures.wasm && \
		export_memory fixtures/fixtures.wasm && \
		echo "Building inline contracts..." && \
		mkdir -p inline/output && \
		cdt-cpp inline/src/r1.cpp -o inline/output/r1.wasm && \
		export_memory inline/output/r1.wasm && \
		cdt-cpp inline/src/r2.cpp -o inline/output/r2.wasm && \
		export_memory inline/output/r2.wasm && \
		cdt-cpp inline/src/i11.cpp -o inline/output/i11.wasm && \
		export_memory inline/output/i11.wasm && \
		cdt-cpp inline/src/i14.cpp -o inline/output/i14.wasm && \
		export_memory inline/output/i14.wasm && \
		cdt-cpp inline/src/i21.cpp -o inline/output/i21.wasm && \
		export_memory inline/output/i21.wasm && \
		cdt-cpp inline/src/i112.cpp -o inline/output/i112.wasm && \
		export_memory inline/output/i112.wasm && \
		cdt-cpp inline/src/i121.cpp -o inline/output/i121.wasm && \
		export_memory inline/output/i121.wasm && \
		cdt-cpp inline/src/i131.cpp -o inline/output/i131.wasm && \
		export_memory inline/output/i131.wasm && \
		cdt-cpp inline/src/i141.cpp -o inline/output/i141.wasm && \
		export_memory inline/output/i141.wasm && \
		cdt-cpp inline/src/i1211.cpp -o inline/output/i1211.wasm && \
		export_memory inline/output/i1211.wasm && \
		cdt-cpp inline/src/i1222.cpp -o inline/output/i1222.wasm && \
		export_memory inline/output/i1222.wasm && \
		cdt-cpp inline/src/n12.cpp -o inline/output/n12.wasm && \
		export_memory inline/output/n12.wasm && \
		cdt-cpp inline/src/n13.cpp -o inline/output/n13.wasm && \
		export_memory inline/output/n13.wasm && \
		cdt-cpp inline/src/n22.cpp -o inline/output/n22.wasm && \
		export_memory inline/output/n22.wasm && \
		cdt-cpp inline/src/n111.cpp -o inline/output/n111.wasm && \
		export_memory inline/output/n111.wasm && \
		cdt-cpp inline/src/n122.cpp -o inline/output/n122.wasm && \
		export_memory inline/output/n122.wasm && \
		cdt-cpp inline/src/n132.cpp -o inline/output/n132.wasm && \
		export_memory inline/output/n132.wasm && \
		cdt-cpp inline/src/n142.cpp -o inline/output/n142.wasm && \
		export_memory inline/output/n142.wasm && \
		cdt-cpp inline/src/n1212.cpp -o inline/output/n1212.wasm && \
		export_memory inline/output/n1212.wasm && \
		cdt-cpp inline/src/n1221.cpp -o inline/output/n1221.wasm && \
		export_memory inline/output/n1221.wasm && \
		echo "All contracts built successfully!" \
	'
