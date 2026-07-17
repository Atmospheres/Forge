package com.forge.repository;

import com.forge.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByProjectIdOrderByPositionAsc(UUID projectId);
}
